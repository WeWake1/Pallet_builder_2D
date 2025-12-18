import { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { useStore } from '../store/useStore';
import { COMPONENT_COLORS, CANVAS_SCALE, A4_WIDTH_PX, A4_HEIGHT_PX } from '../constants';
import type { PalletComponent, TextAnnotation, DimensionAnnotation, CalloutAnnotation } from '../types';

// Module-level canvas reference for export functionality
let globalFabricCanvas: fabric.Canvas | null = null;

export function getGlobalFabricCanvas(): fabric.Canvas | null {
  return globalFabricCanvas;
}

// Custom data interface
interface ComponentData {
  id: string;
  type: string;
  dimensions?: {
    width: number;
    thickness: number;
    length: number;
  };
  isGrid?: boolean;
  isLabel?: boolean;
  isAnnotation?: boolean;
  annotationType?: string;
}

// Helper to get custom data from fabric object
const getObjectData = (obj: fabric.FabricObject): ComponentData | undefined => {
  return (obj as unknown as { data?: ComponentData }).data;
};

// Helper to set custom data on fabric object
const setObjectData = (obj: fabric.FabricObject, data: ComponentData): void => {
  (obj as unknown as { data: ComponentData }).data = data;
};

// Create a pallet component shape (with optional notch or chamfer)
const createComponentShape = (
  component: PalletComponent,
  colors: { fill: string; stroke: string }
): fabric.FabricObject => {
  const { dimensions, type, position, rotation } = component;
  const w = dimensions.width * CANVAS_SCALE;
  const h = dimensions.length * CANVAS_SCALE;
  const x = position.x * CANVAS_SCALE;
  const y = position.y * CANVAS_SCALE;

  // For notched blocks, create a custom shape (fork opening at bottom)
  if (type === 'notched-block') {
    const notchDepth = Math.min(38 * CANVAS_SCALE, h * 0.4); // 38mm or 40% of height
    const notchOffset = w * 0.25; // Notch starts at 25% from each side
    
    // Create path for notched block shape (centered at origin)
    const halfW = w / 2;
    const halfH = h / 2;
    const pathData = `
      M ${-halfW} ${-halfH}
      L ${halfW} ${-halfH}
      L ${halfW} ${halfH - notchDepth}
      L ${halfW - notchOffset} ${halfH - notchDepth}
      L ${halfW - notchOffset} ${halfH}
      L ${-halfW + notchOffset} ${halfH}
      L ${-halfW + notchOffset} ${halfH - notchDepth}
      L ${-halfW} ${halfH - notchDepth}
      Z
    `.trim().replace(/\s+/g, ' ');

    const path = new fabric.Path(pathData, {
      left: x + halfW,
      top: y + halfH,
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      angle: rotation,
      originX: 'center',
      originY: 'center',
    });
    
    return path;
  }

  // For chamfered blocks, create a shape with chamfered corners (centered)
  if (type === 'chamfered-block') {
    const chamferSize = Math.min(10 * CANVAS_SCALE, Math.min(w, h) * 0.15); // 10mm or 15% of smallest dimension
    const halfW = w / 2;
    const halfH = h / 2;
    
    const pathData = `
      M ${-halfW + chamferSize} ${-halfH}
      L ${halfW - chamferSize} ${-halfH}
      L ${halfW} ${-halfH + chamferSize}
      L ${halfW} ${halfH - chamferSize}
      L ${-halfW} ${halfH - chamferSize}
      L ${-halfW} ${-halfH + chamferSize}
      Z
    `.trim().replace(/\s+/g, ' ');

    const path = new fabric.Path(pathData, {
      left: x + halfW,
      top: y + halfH,
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      angle: rotation,
      originX: 'center',
      originY: 'center',
    });
    
    return path;
  }

  // Standard rectangle for other components (centered)
  return new fabric.Rect({
    left: x + w / 2,
    top: y + h / 2,
    width: w,
    height: h,
    fill: colors.fill,
    stroke: colors.stroke,
    strokeWidth: 2,
    angle: rotation,
    originX: 'center',
    originY: 'center',
  });
};

interface UseFabricCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
}

export function useFabricCanvas({ canvasRef, width, height }: UseFabricCanvasProps) {
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const gridStateRef = useRef<{ enabled: boolean; size: number }>({ enabled: false, size: 10 });
  const updateAnnotationRef = useRef<(id: string, updates: Partial<TextAnnotation | DimensionAnnotation | CalloutAnnotation>) => void>(() => {});
  const captureHistoryRef = useRef<() => void>(() => {});
  const isUpdatingSelectionRef = useRef(false); // Prevent circular selection updates
  const isDraggingRef = useRef(false); // Track if we're currently dragging (for history capture)
  const selectedComponentIdsRef = useRef<string[]>([]);
  const selectedAnnotationIdRef = useRef<string | null>(null);
  // Track canvas version to force re-sync when canvas is recreated (e.g., after tab switch)
  const [canvasVersion, setCanvasVersion] = useState(0);
  const { 
    components,
    annotations,
    canvas: canvasState, 
    updateComponent,
    updateAnnotation,
    selectComponent,
    selectComponents,
    selectAnnotation,
    captureHistory,
    selectedComponentIds,
    selectedAnnotationId
  } = useStore();

  // Keep refs in sync with store functions
  useEffect(() => {
    updateAnnotationRef.current = updateAnnotation;
    captureHistoryRef.current = captureHistory;
  }, [updateAnnotation, captureHistory]);

  // Keep selection refs in sync with store
  useEffect(() => {
    selectedComponentIdsRef.current = selectedComponentIds;
    selectedAnnotationIdRef.current = selectedAnnotationId;
  }, [selectedComponentIds, selectedAnnotationId]);

  // Keep snap state ref in sync with store (separate from grid visibility)
  useEffect(() => {
    gridStateRef.current = {
      enabled: canvasState.snapToGrid, // Use snapToGrid for snapping, not gridEnabled
      size: canvasState.gridSize,
    };
  }, [canvasState.snapToGrid, canvasState.gridSize]);

  // Initialize canvas
  useEffect(() => {
    console.log('[useFabricCanvas] Init effect running', { 
      hasCanvasRef: !!canvasRef.current, 
      hasFabricRef: !!fabricRef.current 
    });
    
    if (!canvasRef.current) return;

    // If we already have a fabric instance for this exact element, don't recreate
    if (fabricRef.current && fabricRef.current.getElement() === canvasRef.current) {
      return;
    }

    // If we have a fabric instance but for a different element, dispose it
    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    console.log('[useFabricCanvas] Creating fabric canvas');
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      // Subtle selection box styling
      selectionColor: 'rgba(30, 122, 201, 0.1)',  // Very light blue background
      selectionBorderColor: 'rgba(30, 122, 201, 0.6)',  // Semi-transparent border
      selectionLineWidth: 1,
    });

    console.log('[useFabricCanvas] Canvas created:', { 
      canvasWidth: canvas.width, 
      canvasHeight: canvas.height,
      backgroundColor: canvas.backgroundColor
    });

    // Configure default object styles
    fabric.FabricObject.prototype.set({
      cornerColor: '#1e7ac9',
      cornerStyle: 'circle',
      cornerSize: 10,
      transparentCorners: false,
      borderColor: '#1e7ac9',
      borderScaleFactor: 2,
    });

    fabricRef.current = canvas;
    globalFabricCanvas = canvas; // Set global reference for export
    
    // Increment canvas version to trigger re-sync of components and annotations
    setCanvasVersion(v => v + 1);

    // Handle selection - support multi-selection
    canvas.on('selection:created', (e) => {
      if (isUpdatingSelectionRef.current) return;
      
      const selectedObjects = e.selected || [];
      const componentIds: string[] = [];
      let selectedAnnotationId: string | null = null;
      
      selectedObjects.forEach((obj) => {
        const data = getObjectData(obj);
        if (data?.id && !data.isGrid) {
          if (data.isAnnotation) {
            selectedAnnotationId = data.id;
          } else {
            componentIds.push(data.id);
          }
        }
      });
      
      if (componentIds.length > 0) {
        selectComponents(componentIds);
      } else if (selectedAnnotationId) {
        selectAnnotation(selectedAnnotationId);
      }
    });

    canvas.on('selection:updated', (e) => {
      if (isUpdatingSelectionRef.current) return;
      
      const selectedObjects = e.selected || [];
      const componentIds: string[] = [];
      let selectedAnnotationId: string | null = null;
      
      selectedObjects.forEach((obj) => {
        const data = getObjectData(obj);
        if (data?.id && !data.isGrid) {
          if (data.isAnnotation) {
            selectedAnnotationId = data.id;
          } else {
            componentIds.push(data.id);
          }
        }
      });
      
      if (componentIds.length > 0) {
        selectComponents(componentIds);
      } else if (selectedAnnotationId) {
        selectAnnotation(selectedAnnotationId);
      }
    });

    canvas.on('selection:cleared', () => {
      if (isUpdatingSelectionRef.current) return;
      selectComponent(null);
      selectAnnotation(null);
    });

    // Handle object rotation - snap to 15 degree increments (like Excalidraw)
    // Snap only when shift is NOT held (shift allows free rotation)
    const ROTATION_SNAP_ANGLE = 15; // degrees
    
    canvas.on('object:rotating', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Get the original event to check for shift key
      const event = e.e as MouseEvent | TouchEvent;
      const shiftKey = event && 'shiftKey' in event && event.shiftKey;
      
      // If shift is held, allow free rotation (no snap)
      if (shiftKey) return;
      
      // Snap to nearest 15 degree increment
      const currentAngle = obj.angle || 0;
      const snappedAngle = Math.round(currentAngle / ROTATION_SNAP_ANGLE) * ROTATION_SNAP_ANGLE;
      obj.set({ angle: snappedAngle % 360 });
    });

    // Capture history when user starts interacting with an object
    // This ensures we save state BEFORE the modification, like Excalidraw
    canvas.on('mouse:down', (e) => {
      if (e.target) {
        const data = getObjectData(e.target);
        // Only capture history for real objects (not grid, labels)
        if (data?.id && !data.isGrid && !data.isLabel) {
          isDraggingRef.current = true;
          captureHistoryRef.current();
        }
      }
    });

    canvas.on('mouse:up', () => {
      isDraggingRef.current = false;
    });

    // Handle object moving - snap to grid when enabled
    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      const data = getObjectData(obj);
      // Don't snap grid lines, labels, or annotations
      if (data?.isGrid || data?.isLabel || data?.isAnnotation) return;
      
      const { enabled, size } = gridStateRef.current;
      if (enabled && size > 0) {
        const gridSizePx = size * CANVAS_SCALE;
        
        // Snap position to grid
        const left = obj.left || 0;
        const top = obj.top || 0;
        
        obj.set({
          left: Math.round(left / gridSizePx) * gridSizePx,
          top: Math.round(top / gridSizePx) * gridSizePx,
        });
      }
    });

    // Handle object scaling - just update dimension label in real-time, no snapping during scale
    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      const data = getObjectData(obj);
      if (data?.isGrid || data?.isLabel) return;
      
      // Handle dimension annotation - update text label in real-time
      if (data?.isAnnotation && data.annotationType === 'dimension' && obj instanceof fabric.Group) {
        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        const originalWidth = obj.width || 1;
        const originalHeight = obj.height || 1;
        
        // Calculate new dimension based on scaled size
        const scaledSize = Math.max(originalWidth * scaleX, originalHeight * scaleY);
        const newValueMm = Math.round(scaledSize / CANVAS_SCALE);
        
        // Find and update the text object in the group
        const textObj = obj.getObjects().find((o) => o instanceof fabric.Text);
        if (textObj && textObj instanceof fabric.Text) {
          textObj.set({ text: `${newValueMm} mm` });
        }
      }
    });

    // Handle object modification (drag, resize, rotate) - snap to grid at the end
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      const data = getObjectData(obj);
      if (!data?.id || data.isLabel || data.isGrid) return;
      
      // Skip annotations for now (handled separately)
      if (data.isAnnotation) return;
      
      const { enabled, size } = gridStateRef.current;
      const gridSizePx = size * CANVAS_SCALE;
      
      // Get current center position (objects use center origin)
      let centerX = obj.left || 0;
      let centerY = obj.top || 0;
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      const originalWidth = obj.width || 0;
      const originalHeight = obj.height || 0;
      
      // Calculate final dimensions
      let finalWidth = originalWidth * scaleX;
      let finalHeight = originalHeight * scaleY;
      
      // Convert center to top-left for storage
      let left = centerX - finalWidth / 2;
      let top = centerY - finalHeight / 2;
      
      // Snap to grid if enabled
      if (enabled && gridSizePx > 0) {
        // Snap position (top-left)
        left = Math.round(left / gridSizePx) * gridSizePx;
        top = Math.round(top / gridSizePx) * gridSizePx;
        
        // Snap dimensions (minimum one grid cell)
        finalWidth = Math.max(gridSizePx, Math.round(finalWidth / gridSizePx) * gridSizePx);
        finalHeight = Math.max(gridSizePx, Math.round(finalHeight / gridSizePx) * gridSizePx);
        
        // Recalculate center from snapped top-left
        centerX = left + finalWidth / 2;
        centerY = top + finalHeight / 2;
      }
      
      // Convert to mm for store (store uses top-left position)
      const newPosition = {
        x: Math.round(left / CANVAS_SCALE),
        y: Math.round(top / CANVAS_SCALE),
      };
      
      // For rectangles, update width/height. For paths, only update position and rotation
      const isRect = obj instanceof fabric.Rect;
      
      const newDimensions = isRect ? {
        width: Math.round(finalWidth / CANVAS_SCALE),
        length: Math.round(finalHeight / CANVAS_SCALE),
        thickness: data.dimensions?.thickness || 22,
      } : data.dimensions;
      
      updateComponent(data.id, {
        position: newPosition,
        dimensions: newDimensions,
        rotation: Math.round(obj.angle || 0),
      });

      // Reset scale and apply final dimensions (for rects)
      if (isRect && newDimensions) {
        obj.set({
          left: centerX,
          top: centerY,
          scaleX: 1,
          scaleY: 1,
          width: newDimensions.width * CANVAS_SCALE,
          height: newDimensions.length * CANVAS_SCALE,
        });
        obj.setCoords();
      }
    });

    // Handle double-click on IText for direct text editing
    canvas.on('mouse:dblclick', (e) => {
      const target = e.target;
      if (!target) return;
      
      // If clicking on an IText directly (text annotations), let it handle editing
      if (target instanceof fabric.IText) {
        target.enterEditing();
        return;
      }
      
      // If clicking on a Group (dimension line), try to find and edit the IText inside
      if (target instanceof fabric.Group) {
        const data = getObjectData(target);
        if (data?.annotationType === 'dimension') {
          const textObj = target.getObjects().find((o) => o instanceof fabric.IText);
          if (textObj && textObj instanceof fabric.IText) {
            // Ungroup temporarily to edit text
            canvas.discardActiveObject();
            // Show a prompt for editing dimension value
            const currentValue = textObj.text || '0';
            const newValue = prompt('Enter dimension value (mm):', currentValue);
            if (newValue !== null && !isNaN(Number(newValue))) {
              const numValue = parseInt(newValue, 10);
              textObj.set({ text: `${numValue}` });
              canvas.renderAll();
              
              // Update store
              if (data.id) {
                updateAnnotationRef.current(data.id, { value: numValue });
              }
            }
          }
        }
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
      globalFabricCanvas = null; // Clear global reference
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current]);

  // Update canvas size
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setDimensions({ width, height });
    fabricRef.current.renderAll();
  }, [width, height]);

  // Draw grid when enabled
  useEffect(() => {
    console.log('[useFabricCanvas] Grid effect running', { 
      hasFabricRef: !!fabricRef.current,
      gridEnabled: canvasState.gridEnabled
    });
    
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    
    // Remove existing grid lines and paper border
    objects.forEach((obj) => {
      const data = getObjectData(obj);
      if (data?.isGrid) {
        canvas.remove(obj);
      }
    });
    
    // Draw grid if enabled
    if (canvasState.gridEnabled) {
      const gridSizeMm = canvasState.gridSize; // Grid size in mm
      
      // Colors - slightly more visible
    const minorColor = canvasState.darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
    const majorColor = canvasState.darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';

    const gridLines: fabric.FabricObject[] = [];
      
      // Paper dimensions in pixels (always use exact A4 dimensions)
      const paperWidthPx = A4_WIDTH_PX;
      const paperHeightPx = A4_HEIGHT_PX;
      const paperWidthMm = 210;
      const paperHeightMm = 297;
      
      // Snap a coordinate to a device pixel boundary so 1px strokes are crisp.
      // The canvas is displayed with a CSS transform scale() in MultiViewCanvas,
      // so `zoom` here is that scale factor.
      const zoomForCrisp = width > 0 ? width / A4_WIDTH_PX : 1;
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      const snapToDevicePixel = (coordPx: number, strokeWidthPx: number) => {
        const scaled = coordPx * zoomForCrisp * dpr;
        const snapped = Math.round(scaled) + (strokeWidthPx % 2 === 1 ? 0.5 : 0);
        return snapped / (zoomForCrisp * dpr);
      };

      // Major grid spacing (big squares)
      const MAJOR_MM = 50;
      // Offset major grid so that a major line lands exactly on the far edge.
      // Example: 210mm => offset 10mm, so majors are at 10,60,110,160,210.
      const majorOffsetY = ((paperHeightMm % MAJOR_MM) + MAJOR_MM) % MAJOR_MM;

      // Draw vertical lines (NO major verticals - per UX request)
      const vCount = Math.floor(paperWidthMm / gridSizeMm);
      for (let i = 0; i <= vCount; i++) {
        const xMm = i * gridSizeMm;
        const strokeWidth = 0.5;
        const xPx = snapToDevicePixel(xMm * CANVAS_SCALE, strokeWidth);

        const line = new fabric.Line([xPx, 0, xPx, paperHeightPx], {
          stroke: minorColor,
          strokeWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          strokeUniform: true,
        });
        setObjectData(line, { id: `grid-v-${xMm}`, type: 'grid', isGrid: true });
        gridLines.push(line);
      }
      
      // (No extra edge overlays needed; edges are included in the loop)
      
      // Draw horizontal lines (including edges at 0 and 297mm)
      const hCount = Math.floor(paperHeightMm / gridSizeMm);
      for (let i = 0; i <= hCount; i++) {
        const yMm = i * gridSizeMm;
        const isMajor = ((yMm - majorOffsetY) % MAJOR_MM === 0);
        const strokeWidth = isMajor ? 1 : 0.5;
        const yPx = snapToDevicePixel(yMm * CANVAS_SCALE, strokeWidth);
        
        // Horizontal line spans full paper width
        const line = new fabric.Line([0, yPx, paperWidthPx, yPx], {
          stroke: isMajor ? majorColor : minorColor,
          strokeWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          strokeUniform: true,
        });
        setObjectData(line, { id: `grid-h-${yMm}`, type: 'grid', isGrid: true });
        gridLines.push(line);
      }
      
      // (No extra edge overlays needed; edges are included in the loop)

      // Group and lock transforms so the grid never shifts and strokes don't scale.
      const gridGroup = new fabric.Group(gridLines, {
        selectable: false,
        evented: false,
        excludeFromExport: true,
        subTargetCheck: false,
      });
      setObjectData(gridGroup, { id: 'grid-group', type: 'grid', isGrid: true });
      
      canvas.add(gridGroup);
      canvas.sendObjectToBack(gridGroup);
      
      console.log('[useFabricCanvas] Grid lines added:', gridLines.length);
    }
    
    console.log('[useFabricCanvas] Grid effect complete, objects on canvas:', canvas.getObjects().length);
    canvas.renderAll();
  }, [canvasState.gridEnabled, canvasState.gridSize, canvasState.darkMode, width, height, canvasVersion]);

  // Update canvas background for dark mode
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.backgroundColor = canvasState.darkMode ? '#1e293b' : '#ffffff';
    canvas.renderAll();
  }, [canvasState.darkMode]);

  // Sync components to canvas
  const syncComponents = useCallback((viewComponents: PalletComponent[]) => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    
    // Track which IDs we've processed
    const processedIds = new Set<string>();
    
    // Add or update objects
    viewComponents.forEach((component) => {
      processedIds.add(component.id);
      
      const existingObj = objects.find((obj) => {
        const data = getObjectData(obj);
        return data?.id === component.id && !data.isLabel;
      });

      // Use custom color if set, otherwise use default for component type
      const colors = component.color || COMPONENT_COLORS[component.type];

      if (existingObj) {
        const isRect = existingObj instanceof fabric.Rect;
        const w = component.dimensions.width * CANVAS_SCALE;
        const h = component.dimensions.length * CANVAS_SCALE;
        
        // Update colors
        existingObj.set({
          fill: colors.fill,
          stroke: colors.stroke,
        });
        
        // For rectangles, we can update width/height directly
        // Objects use center origin, so position is center of object
        if (isRect) {
          existingObj.set({
            left: component.position.x * CANVAS_SCALE + w / 2,
            top: component.position.y * CANVAS_SCALE + h / 2,
            width: w,
            height: h,
            angle: component.rotation,
            scaleX: 1,
            scaleY: 1,
          });
        } else {
          // For paths (centered at origin), position is center of object
          existingObj.set({
            left: component.position.x * CANVAS_SCALE + w / 2,
            top: component.position.y * CANVAS_SCALE + h / 2,
            angle: component.rotation,
          });
        }
        
        // Update the stored data
        setObjectData(existingObj, {
          id: component.id,
          type: component.type,
          dimensions: component.dimensions,
        });
        existingObj.setCoords();
      } else {
        // Create new object using the shape factory
        const shape = createComponentShape(component, colors);
        
        setObjectData(shape, {
          id: component.id,
          type: component.type,
          dimensions: component.dimensions,
        });
        
        canvas.add(shape);
      }
    });

    // Remove objects that no longer exist (excluding annotations)
    objects.forEach((obj) => {
      const data = getObjectData(obj);
      if (data?.id && !data.isGrid && !data.isLabel && !data.isAnnotation && !processedIds.has(data.id)) {
        canvas.remove(obj);
      }
    });

    // Reorder fabric objects to match the store array order (z-ordering)
    // The store array order determines layering: first item = back, last item = front
    // We need to remove and re-add objects in the correct order
    const componentObjects: fabric.FabricObject[] = [];
    viewComponents.forEach((component) => {
      const fabricObj = canvas.getObjects().find((obj) => {
        const data = getObjectData(obj);
        return data?.id === component.id && !data.isGrid && !data.isLabel && !data.isAnnotation;
      });
      if (fabricObj) {
        componentObjects.push(fabricObj);
      }
    });
    
    // Temporarily disable selection events to prevent clearing selection during reordering
    isUpdatingSelectionRef.current = true;

    // Remove all component objects from canvas
    componentObjects.forEach((obj) => canvas.remove(obj));
    
    // Re-add them in the correct order (store order)
    componentObjects.forEach((obj) => canvas.add(obj));

    // Re-enable selection events
    isUpdatingSelectionRef.current = false;

    canvas.renderAll();
  }, []);

  // Create annotation object
  const createAnnotationObject = useCallback((annotation: TextAnnotation | DimensionAnnotation | CalloutAnnotation): fabric.FabricObject | fabric.Group | null => {
    // Helper to check if color is "black-ish" (default text colors)
    const isBlackish = (c: string) => ['#000000', '#000', 'black', '#333333', '#1f2937'].includes(c?.toLowerCase());
    
    if (annotation.type === 'text') {
      const annotationId = annotation.id;
      // Auto-switch black text to white in dark mode
      const displayColor = (canvasState.darkMode && isBlackish(annotation.color)) ? '#ffffff' : annotation.color;
      
      const textObj = new fabric.IText(annotation.text, {
        left: annotation.position.x * CANVAS_SCALE,
        top: annotation.position.y * CANVAS_SCALE,
        fontSize: annotation.fontSize * CANVAS_SCALE / 2,
        fill: displayColor,
        fontFamily: 'Arial',
        fontWeight: annotation.fontWeight,
        angle: annotation.rotation,
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
        editable: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
      });
      
      // Handle text editing - update store when editing is complete
      textObj.on('editing:exited', () => {
        const newText = textObj.text || '';
        updateAnnotationRef.current(annotationId, { text: newText });
      });
      
      // Handle modification (move, rotate, scale)
      textObj.on('modified', () => {
        const updates: Partial<TextAnnotation> = {
          position: {
            x: Math.round((textObj.left || 0) / CANVAS_SCALE),
            y: Math.round((textObj.top || 0) / CANVAS_SCALE),
          },
          rotation: Math.round(textObj.angle || 0),
        };

        // Handle scaling - update font size instead of scale
        if (textObj.scaleX !== 1 || textObj.scaleY !== 1) {
          const scale = Math.max(textObj.scaleX || 1, textObj.scaleY || 1);
          const currentFontSize = textObj.fontSize || 12;
          const newFontSize = currentFontSize * scale;
          
          textObj.set({
            fontSize: newFontSize,
            scaleX: 1,
            scaleY: 1
          });
          
          // Update store with new font size (convert back from pixels)
          const storeFontSize = Math.round(newFontSize * 2 / CANVAS_SCALE);
          updates.fontSize = storeFontSize;
        }

        updateAnnotationRef.current(annotationId, updates);
      });
      
      return textObj;
    } else if (annotation.type === 'dimension') {
      const x1 = annotation.startPosition.x * CANVAS_SCALE;
      const y1 = annotation.startPosition.y * CANVAS_SCALE;
      const x2 = annotation.endPosition.x * CANVAS_SCALE;
      const y2 = annotation.endPosition.y * CANVAS_SCALE;
      
      // Calculate line properties
      const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const distanceMm = Math.round(lineLength / CANVAS_SCALE);
      const displayValue = annotation.value > 0 ? annotation.value : distanceMm;
      
      // Calculate angle and midpoint
      const lineAngle = Math.atan2(y2 - y1, x2 - x1);
      const lineAngleDeg = (lineAngle * 180) / Math.PI;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Blue color scheme (matching the reference)
      const dimensionColor = '#1e7ac9';
      
      // Calculate text width to create gap in line
      const textContent = `${displayValue}mm`;
      const textWidth = textContent.length * 10; // Approximate text width
      const gapWidth = textWidth + 20; // Gap for text with padding
      const halfLength = lineLength / 2;
      const halfGap = gapWidth / 2;
      
      // Left line segment (from start to gap)
      const leftLine = new fabric.Line([
        -halfLength, 0,
        -halfGap, 0,
      ], {
        stroke: dimensionColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      // Right line segment (from gap to end)
      const rightLine = new fabric.Line([
        halfGap, 0,
        halfLength, 0,
      ], {
        stroke: dimensionColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      // End caps (perpendicular lines at the ends)
      const capSize = 12;
      const cap1 = new fabric.Line([
        -halfLength, -capSize,
        -halfLength, capSize,
      ], {
        stroke: dimensionColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      const cap2 = new fabric.Line([
        halfLength, -capSize,
        halfLength, capSize,
      ], {
        stroke: dimensionColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      // Text in the middle
      const text = new fabric.IText(textContent, {
        left: 0,
        top: 0,
        fontSize: 16,
        fill: dimensionColor,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
        selectable: false,
        editable: false, // We'll handle editing via double-click
      });
      
      const annotationId = annotation.id;
      
      // Create the group centered at midpoint
      const group = new fabric.Group([leftLine, rightLine, cap1, cap2, text], {
        left: midX,
        top: midY,
        originX: 'center',
        originY: 'center',
        angle: lineAngleDeg,
        centeredRotation: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
      });
      
      // Handle scaling - update dimension value dynamically
      group.on('scaling', () => {
        const scaleX = group.scaleX || 1;
        const scaleY = group.scaleY || 1;
        
        // Calculate new dimension based on horizontal scale
        const newLength = lineLength * scaleX;
        const newValueMm = Math.round(newLength / CANVAS_SCALE);
        
        // Update the text
        const textObj = group.getObjects().find((o) => o instanceof fabric.IText);
        if (textObj && textObj instanceof fabric.IText) {
          textObj.set({ 
            text: `${newValueMm}mm`,
            scaleX: 1 / scaleX,
            scaleY: 1 / scaleY,
          });
        }
      });
      
      // Handle modification complete - save to store
      group.on('modified', () => {
        const scaleX = group.scaleX || 1;
        const groupAngle = group.angle || 0;
        const groupAngleRad = (groupAngle * Math.PI) / 180;
        
        const newLength = lineLength * scaleX;
        const newValueMm = Math.round(newLength / CANVAS_SCALE);
        
        const groupLeft = group.left || 0;
        const groupTop = group.top || 0;
        const halfNewLength = (newLength / 2);
        
        const dx = Math.cos(groupAngleRad) * halfNewLength;
        const dy = Math.sin(groupAngleRad) * halfNewLength;
        
        updateAnnotationRef.current(annotationId, {
          value: newValueMm,
          startPosition: {
            x: Math.round((groupLeft - dx) / CANVAS_SCALE),
            y: Math.round((groupTop - dy) / CANVAS_SCALE),
          },
          endPosition: {
            x: Math.round((groupLeft + dx) / CANVAS_SCALE),
            y: Math.round((groupTop + dy) / CANVAS_SCALE),
          },
        });
        
        // Reset scale
        group.set({ scaleX: 1, scaleY: 1 });
        group.getObjects().forEach((obj) => {
          if (obj instanceof fabric.Text) {
            obj.set({ scaleX: 1, scaleY: 1 });
          }
        });
      });
      
      return group;
    } else if (annotation.type === 'callout') {
      const anchorX = annotation.anchorPosition.x * CANVAS_SCALE;
      const anchorY = annotation.anchorPosition.y * CANVAS_SCALE;
      const textX = annotation.textPosition.x * CANVAS_SCALE;
      const textY = annotation.textPosition.y * CANVAS_SCALE;
      const annotationId = annotation.id;
      
      // Create a movable group for the callout
      // The group contains: anchor circle, leader line, and text
      
      // Circle at anchor point (relative to group origin)
      const circle = new fabric.Circle({
        left: 0,
        top: 0,
        radius: 5,
        fill: '#ff6b6b',
        stroke: '#333333',
        strokeWidth: 1.5,
        originX: 'center',
        originY: 'center',
        selectable: false,
      });
      
      // Leader line from anchor to text (relative positions)
      const lineEndX = textX - anchorX;
      const lineEndY = textY - anchorY;
      const line = new fabric.Line([0, 0, lineEndX, lineEndY], {
        stroke: '#333333',
        strokeWidth: 1.5,
        selectable: false,
      });
      
      // Text label - no background (transparent)
      const text = new fabric.IText(annotation.text, {
        left: lineEndX,
        top: lineEndY - 8,
        fontSize: 12,
        fill: '#333333',
        fontFamily: 'Arial',
        backgroundColor: '', // Clear/transparent background
        selectable: false,
        editable: true,
        originX: 'center',
        originY: 'bottom',
      });
      
      // Create the group positioned at anchor
      const group = new fabric.Group([line, circle, text], {
        left: anchorX,
        top: anchorY,
        originX: 'left',
        originY: 'top',
        subTargetCheck: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      });
      
      // Handle text editing via double-click on group
      group.on('mousedblclick', () => {
        // Find text in group and enter edit mode
        const textInGroup = group.getObjects().find((o) => o instanceof fabric.IText);
        if (textInGroup && textInGroup instanceof fabric.IText) {
          // Ungroup temporarily for editing - use prompt instead
          const currentText = textInGroup.text || '';
          const newText = prompt('Edit callout text:', currentText);
          if (newText !== null) {
            textInGroup.set({ text: newText });
            group.setCoords();
            fabricRef.current?.renderAll();
            updateAnnotationRef.current(annotationId, { text: newText });
          }
        }
      });
      
      // Handle group modification - update positions
      group.on('modified', () => {
        const groupLeft = group.left || 0;
        const groupTop = group.top || 0;
        
        // Update anchor position (group origin is at anchor)
        updateAnnotationRef.current(annotationId, {
          anchorPosition: {
            x: Math.round(groupLeft / CANVAS_SCALE),
            y: Math.round(groupTop / CANVAS_SCALE),
          },
          textPosition: {
            x: Math.round((groupLeft + lineEndX) / CANVAS_SCALE),
            y: Math.round((groupTop + lineEndY) / CANVAS_SCALE),
          },
        });
      });
      
      return group;
    }
    
    return null;
  }, [canvasState.darkMode]);

  // Sync annotations to canvas
  const syncAnnotations = useCallback((viewAnnotations: (TextAnnotation | DimensionAnnotation | CalloutAnnotation)[]) => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    
    // Track which annotation IDs we've processed
    const processedIds = new Set<string>();
    
    // Add or update annotations
    viewAnnotations.forEach((annotation) => {
      processedIds.add(annotation.id);
      
      const existingObj = objects.find((obj) => {
        const data = getObjectData(obj);
        return data?.id === annotation.id && data.isAnnotation;
      });

      if (existingObj) {
        // Update existing annotation position without recreating
        // This preserves event handlers and interactivity
        // Ensure selectability flags are always set
        existingObj.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
        });
        
        if (annotation.type === 'text') {
          // Auto-switch black text to white in dark mode
          const isBlackish = (c: string) => ['#000000', '#000', 'black', '#333333', '#1f2937'].includes(c?.toLowerCase());
          const displayColor = (canvasState.darkMode && isBlackish(annotation.color)) ? '#ffffff' : annotation.color;

          existingObj.set({
            left: annotation.position.x * CANVAS_SCALE,
            top: annotation.position.y * CANVAS_SCALE,
            angle: annotation.rotation,
            fontSize: annotation.fontSize * CANVAS_SCALE / 2,
            fontWeight: annotation.fontWeight,
            fill: displayColor,
          });
          if (existingObj instanceof fabric.IText && existingObj.text !== annotation.text) {
            existingObj.set({ text: annotation.text });
          }
          existingObj.setCoords();
        } else if (annotation.type === 'dimension') {
          // For dimension lines, update position (more complex - group center)
          const x1 = annotation.startPosition.x * CANVAS_SCALE;
          const y1 = annotation.startPosition.y * CANVAS_SCALE;
          const x2 = annotation.endPosition.x * CANVAS_SCALE;
          const y2 = annotation.endPosition.y * CANVAS_SCALE;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const lineAngle = Math.atan2(y2 - y1, x2 - x1);
          const lineAngleDeg = (lineAngle * 180) / Math.PI;
          
          existingObj.set({
            left: midX,
            top: midY,
            angle: lineAngleDeg,
          });
          existingObj.setCoords();
        } else if (annotation.type === 'callout') {
          existingObj.set({
            left: annotation.anchorPosition.x * CANVAS_SCALE,
            top: annotation.anchorPosition.y * CANVAS_SCALE,
          });
          existingObj.setCoords();
        }
      } else {
        // Create new annotation
        const annotationObj = createAnnotationObject(annotation);
        if (annotationObj) {
          setObjectData(annotationObj, {
            id: annotation.id,
            type: annotation.type,
            isAnnotation: true,
            annotationType: annotation.type,
          });
          
          canvas.add(annotationObj);
        }
      }
    });

    // Remove annotations that no longer exist
    objects.forEach((obj) => {
      const data = getObjectData(obj);
      if (data?.id && data.isAnnotation && !processedIds.has(data.id)) {
        canvas.remove(obj);
      }
    });

    // Note: z-ordering is handled in the combined sync effect

    canvas.renderAll();
  }, [createAnnotationObject, canvasState.darkMode]);

  // Watch for component AND annotation changes together
  // This ensures proper z-ordering: grid -> components -> annotations
  // Also re-syncs when canvasVersion changes (after canvas recreation, e.g., tab switch)
  useEffect(() => {
    console.log('[useFabricCanvas] Sync effect running', { 
      hasFabricRef: !!fabricRef.current,
      activeView: canvasState.activeView,
      componentCount: components[canvasState.activeView]?.length || 0,
      annotationCount: annotations[canvasState.activeView]?.length || 0,
      components: components[canvasState.activeView],
      canvasVersion
    });
    
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const viewComponents = components[canvasState.activeView];
    const viewAnnotations = annotations[canvasState.activeView];
    
    // Sync components first
    syncComponents(viewComponents);
    
    // Then sync annotations
    syncAnnotations(viewAnnotations);
    
    // Ensure proper z-ordering: grid at back
    // We don't force annotations to front anymore to allow manual layering
    const objects = canvas.getObjects();
    
    // Send all grid objects to back
    objects.forEach((obj) => {
      const data = getObjectData(obj);
      if (data?.isGrid) {
        canvas.sendObjectToBack(obj);
      }
    });

    // Restore selection state after sync
    // This is crucial because removing/re-adding objects (in syncComponents) clears selection
    const selectedComponentIds = selectedComponentIdsRef.current;
    const selectedAnnotationId = selectedAnnotationIdRef.current;

    if (selectedComponentIds.length > 0) {
      const objectsToSelect = canvas.getObjects().filter((o) => {
        const data = getObjectData(o);
        return data?.id && selectedComponentIds.includes(data.id) && !data.isLabel && !data.isGrid;
      });
      
      if (objectsToSelect.length > 0) {
        // Temporarily disable selection events to prevent loops
        isUpdatingSelectionRef.current = true;
        if (objectsToSelect.length === 1) {
          if (canvas.getActiveObject() !== objectsToSelect[0]) {
            canvas.setActiveObject(objectsToSelect[0]);
          }
        } else {
          // Check if current selection is already correct to avoid flicker
          const currentActive = canvas.getActiveObject();
          const isSameSelection = currentActive instanceof fabric.ActiveSelection && 
            currentActive.getObjects().length === objectsToSelect.length &&
            currentActive.getObjects().every(o => objectsToSelect.includes(o));
            
          if (!isSameSelection) {
            const activeSelection = new fabric.ActiveSelection(objectsToSelect, { canvas });
            canvas.setActiveObject(activeSelection);
          }
        }
        isUpdatingSelectionRef.current = false;
      }
    } else if (selectedAnnotationId) {
      const annotationObj = canvas.getObjects().find((o) => {
        const data = getObjectData(o);
        return data?.id === selectedAnnotationId && data.isAnnotation;
      });

      if (annotationObj) {
        isUpdatingSelectionRef.current = true;
        if (canvas.getActiveObject() !== annotationObj) {
          canvas.setActiveObject(annotationObj);
        }
        isUpdatingSelectionRef.current = false;
      }
    }
    
    canvas.renderAll();
  }, [components, annotations, canvasState.activeView, syncComponents, syncAnnotations, canvasVersion]);

  // Handle selection from state - support multi-selection
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    // Prevent circular updates
    isUpdatingSelectionRef.current = true;
    
    try {
      if (selectedComponentIds.length > 0) {
        const objectsToSelect = canvas.getObjects().filter((o) => {
          const data = getObjectData(o);
          return data?.id && selectedComponentIds.includes(data.id) && !data.isLabel && !data.isGrid;
        });
        
        if (objectsToSelect.length === 1) {
          // Single selection
          if (canvas.getActiveObject() !== objectsToSelect[0]) {
            canvas.setActiveObject(objectsToSelect[0]);
            canvas.renderAll();
          }
        } else if (objectsToSelect.length > 1) {
          // Multi-selection - create an ActiveSelection
          const activeSelection = new fabric.ActiveSelection(objectsToSelect, { canvas });
          canvas.setActiveObject(activeSelection);
          canvas.renderAll();
        }
      } else if (selectedAnnotationId) {
        // Handle annotation selection
        const annotationObj = canvas.getObjects().find((o) => {
          const data = getObjectData(o);
          return data?.id === selectedAnnotationId && data.isAnnotation;
        });

        if (annotationObj) {
          if (canvas.getActiveObject() !== annotationObj) {
            canvas.setActiveObject(annotationObj);
            canvas.renderAll();
          }
        }
      } else {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    } finally {
      // Reset flag after a small delay to ensure events have been processed
      setTimeout(() => {
        isUpdatingSelectionRef.current = false;
      }, 0);
    }
  }, [selectedComponentIds, selectedAnnotationId]);

  return fabricRef;
}

