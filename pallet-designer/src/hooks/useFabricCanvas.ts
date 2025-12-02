import { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { useStore } from '../store/useStore';
import { COMPONENT_COLORS, CANVAS_SCALE } from '../constants';
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
    
    // Create path for notched block shape
    const pathData = `
      M 0 0
      L ${w} 0
      L ${w} ${h - notchDepth}
      L ${w - notchOffset} ${h - notchDepth}
      L ${w - notchOffset} ${h}
      L ${notchOffset} ${h}
      L ${notchOffset} ${h - notchDepth}
      L 0 ${h - notchDepth}
      Z
    `.trim().replace(/\s+/g, ' ');

    const path = new fabric.Path(pathData, {
      left: x,
      top: y,
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      angle: rotation,
    });
    
    return path;
  }

  // For chamfered blocks, create a shape with chamfered corners
  if (type === 'chamfered-block') {
    const chamferSize = Math.min(10 * CANVAS_SCALE, Math.min(w, h) * 0.15); // 10mm or 15% of smallest dimension
    
    const pathData = `
      M ${chamferSize} 0
      L ${w - chamferSize} 0
      L ${w} ${chamferSize}
      L ${w} ${h - chamferSize}
      L ${w - chamferSize} ${h}
      L ${chamferSize} ${h}
      L 0 ${h - chamferSize}
      L 0 ${chamferSize}
      Z
    `.trim().replace(/\s+/g, ' ');

    const path = new fabric.Path(pathData, {
      left: x,
      top: y,
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      angle: rotation,
    });
    
    return path;
  }

  // Standard rectangle for other components
  return new fabric.Rect({
    left: x,
    top: y,
    width: w,
    height: h,
    fill: colors.fill,
    stroke: colors.stroke,
    strokeWidth: 2,
    angle: rotation,
  });
};

interface UseFabricCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
}

export function useFabricCanvas({ canvasRef, width, height }: UseFabricCanvasProps) {
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const { 
    components,
    annotations,
    canvas: canvasState, 
    updateComponent, 
    selectComponent,
    selectedComponentId 
  } = useStore();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
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

    // Handle selection
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0];
      const data = selected ? getObjectData(selected) : undefined;
      if (data?.id) {
        selectComponent(data.id);
      }
    });

    canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0];
      const data = selected ? getObjectData(selected) : undefined;
      if (data?.id) {
        selectComponent(data.id);
      }
    });

    canvas.on('selection:cleared', () => {
      selectComponent(null);
    });

    // Handle object modification (drag, resize, rotate)
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      const data = getObjectData(obj);
      if (data?.id && !data.isLabel) {
        const newPosition = {
          x: Math.round((obj.left || 0) / CANVAS_SCALE),
          y: Math.round((obj.top || 0) / CANVAS_SCALE),
        };
        
        // For rectangles, we can update width/height
        // For paths (notched/chamfered), we only update position and rotation for now
        const isRect = obj instanceof fabric.Rect;
        
        const newDimensions = isRect ? {
          width: Math.round(((obj.width || 0) * (obj.scaleX || 1)) / CANVAS_SCALE),
          length: Math.round(((obj.height || 0) * (obj.scaleY || 1)) / CANVAS_SCALE),
          thickness: data.dimensions?.thickness || 22,
        } : data.dimensions;
        
        updateComponent(data.id, {
          position: newPosition,
          dimensions: newDimensions,
          rotation: Math.round(obj.angle || 0),
        });

        // Reset scale after updating dimensions (for rects)
        if (isRect && newDimensions) {
          obj.set({
            scaleX: 1,
            scaleY: 1,
            width: newDimensions.width * CANVAS_SCALE,
            height: newDimensions.length * CANVAS_SCALE,
          });
          obj.setCoords();
        }
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
      globalFabricCanvas = null; // Clear global reference
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update canvas size
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setDimensions({ width, height });
    fabricRef.current.renderAll();
  }, [width, height]);

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

      const colors = COMPONENT_COLORS[component.type];

      if (existingObj) {
        const isRect = existingObj instanceof fabric.Rect;
        
        // For rectangles, we can update width/height directly
        if (isRect) {
          existingObj.set({
            left: component.position.x * CANVAS_SCALE,
            top: component.position.y * CANVAS_SCALE,
            width: component.dimensions.width * CANVAS_SCALE,
            height: component.dimensions.length * CANVAS_SCALE,
            angle: component.rotation,
            scaleX: 1,
            scaleY: 1,
          });
        } else {
          // For paths, just update position and rotation
          existingObj.set({
            left: component.position.x * CANVAS_SCALE,
            top: component.position.y * CANVAS_SCALE,
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

    canvas.renderAll();
  }, []);

  // Create annotation object
  const createAnnotationObject = useCallback((annotation: TextAnnotation | DimensionAnnotation | CalloutAnnotation): fabric.FabricObject | fabric.Group | null => {
    if (annotation.type === 'text') {
      const textObj = new fabric.IText(annotation.text, {
        left: annotation.position.x * CANVAS_SCALE,
        top: annotation.position.y * CANVAS_SCALE,
        fontSize: annotation.fontSize * CANVAS_SCALE / 2,
        fill: annotation.color,
        fontFamily: 'Arial',
        fontWeight: annotation.fontWeight,
        angle: annotation.rotation,
      });
      return textObj;
    } else if (annotation.type === 'dimension') {
      const x1 = annotation.startPosition.x * CANVAS_SCALE;
      const y1 = annotation.startPosition.y * CANVAS_SCALE;
      const x2 = annotation.endPosition.x * CANVAS_SCALE;
      const y2 = annotation.endPosition.y * CANVAS_SCALE;
      
      // Create line
      const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: '#333333',
        strokeWidth: 1,
      });
      
      // Create end caps
      const capSize = 6;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      
      const cap1 = new fabric.Line([
        x1 - Math.sin(angle) * capSize,
        y1 + Math.cos(angle) * capSize,
        x1 + Math.sin(angle) * capSize,
        y1 - Math.cos(angle) * capSize,
      ], { stroke: '#333333', strokeWidth: 1 });
      
      const cap2 = new fabric.Line([
        x2 - Math.sin(angle) * capSize,
        y2 + Math.cos(angle) * capSize,
        x2 + Math.sin(angle) * capSize,
        y2 - Math.cos(angle) * capSize,
      ], { stroke: '#333333', strokeWidth: 1 });
      
      // Create text label
      const textX = (x1 + x2) / 2;
      const textY = (y1 + y2) / 2 - 8;
      const text = new fabric.Text(`${annotation.value} mm`, {
        left: textX,
        top: textY,
        fontSize: 10,
        fill: '#333333',
        fontFamily: 'Arial',
        originX: 'center',
        originY: 'bottom',
        backgroundColor: 'white',
      });
      
      const group = new fabric.Group([line, cap1, cap2, text], {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2) - 10,
      });
      
      return group;
    } else if (annotation.type === 'callout') {
      const anchorX = annotation.anchorPosition.x * CANVAS_SCALE;
      const anchorY = annotation.anchorPosition.y * CANVAS_SCALE;
      const textX = annotation.textPosition.x * CANVAS_SCALE;
      const textY = annotation.textPosition.y * CANVAS_SCALE;
      
      // Leader line
      const line = new fabric.Line([anchorX, anchorY, textX, textY], {
        stroke: '#333333',
        strokeWidth: 1,
      });
      
      // Text with background
      const text = new fabric.Text(annotation.text, {
        left: textX,
        top: textY,
        fontSize: 10,
        fill: '#333333',
        fontFamily: 'Arial',
        backgroundColor: '#fffde7',
        padding: 4,
      });
      
      // Circle at anchor point
      const circle = new fabric.Circle({
        left: anchorX - 3,
        top: anchorY - 3,
        radius: 3,
        fill: '#333333',
      });
      
      const group = new fabric.Group([line, text, circle]);
      return group;
    }
    
    return null;
  }, []);

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
        // For now, remove and recreate (simpler than updating)
        canvas.remove(existingObj);
      }
      
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
    });

    // Remove annotations that no longer exist
    objects.forEach((obj) => {
      const data = getObjectData(obj);
      if (data?.id && data.isAnnotation && !processedIds.has(data.id)) {
        canvas.remove(obj);
      }
    });

    canvas.renderAll();
  }, [createAnnotationObject]);

  // Watch for component changes
  useEffect(() => {
    const viewComponents = components[canvasState.activeView];
    syncComponents(viewComponents);
  }, [components, canvasState.activeView, syncComponents]);

  // Watch for annotation changes
  useEffect(() => {
    const viewAnnotations = annotations[canvasState.activeView];
    syncAnnotations(viewAnnotations);
  }, [annotations, canvasState.activeView, syncAnnotations]);

  // Handle selection from state
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    if (selectedComponentId) {
      const obj = canvas.getObjects().find((o) => {
        const data = getObjectData(o);
        return data?.id === selectedComponentId && !data.isLabel;
      });
      if (obj && canvas.getActiveObject() !== obj) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
      }
    } else {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [selectedComponentId]);

  return fabricRef;
}
