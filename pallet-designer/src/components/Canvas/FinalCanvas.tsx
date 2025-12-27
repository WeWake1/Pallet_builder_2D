import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import * as fabric from 'fabric';
import { VIEW_LABELS, A4_WIDTH_PX, A4_HEIGHT_PX, CANVAS_SCALE, COMPONENT_COLORS } from '../../constants';
import type { ViewType } from '../../types';

interface FinalCanvasProps {
  containerSize: { width: number; height: number };
  zoom: number;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const VIEWS: ViewType[] = ['top', 'side', 'end', 'bottom'];

// Template layout constants (landscape A4)
const TEMPLATE_WIDTH = A4_HEIGHT_PX; // Landscape: height becomes width (297mm * 2 = 594px)
const TEMPLATE_HEIGHT = A4_WIDTH_PX; // Landscape: width becomes height (210mm * 2 = 420px)
const MARGIN = 12 * CANVAS_SCALE; // 12mm margin
const SPEC_BOX_WIDTH = 65 * CANVAS_SCALE; // 65mm spec box
const VIEW_GAP = 4 * CANVAS_SCALE; // 4mm gap between views

export function FinalCanvas({ containerSize, zoom, onContextMenu }: FinalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const { 
    components, 
    annotations, 
    specification, 
    branding, 
    currentPreset,
    canvas: canvasState,
    selectComponents,
    selectComponent,
    setFinalCanvasExportFn,
    finalViewConfig,
    updateFinalViewConfig,
    finalTextConfig,
    updateFinalTextConfig,
  } = useStore();

  const isDarkMode = canvasState.darkMode;

  // Calculate display dimensions
  const { displayWidth, displayHeight, scale } = (() => {
    const templateAspect = TEMPLATE_WIDTH / TEMPLATE_HEIGHT;
    let width: number;
    let height: number;

    if (containerSize.height > 0) {
      if (containerSize.width / containerSize.height > templateAspect) {
        height = Math.min(containerSize.height - 100, 500);
        width = height * templateAspect;
      } else {
        width = Math.min(containerSize.width - 40, 800);
        height = width / templateAspect;
      }
    } else {
      width = 700;
      height = width / templateAspect;
    }

    return {
      displayWidth: width,
      displayHeight: height,
      scale: (width * zoom) / TEMPLATE_WIDTH,
    };
  })();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: TEMPLATE_WIDTH,
      height: TEMPLATE_HEIGHT,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      selectionColor: 'rgba(30, 122, 201, 0.1)',
      selectionBorderColor: 'rgba(30, 122, 201, 0.6)',
      selectionLineWidth: 1,
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

    // Handle selection
    canvas.on('selection:created', (e) => {
      const selected = e.selected || [];
      // Extract component IDs from the data property we set on objects
      const ids = selected
        .map(obj => (obj as unknown as { data?: { componentId?: string } }).data?.componentId)
        .filter((id): id is string => !!id);
      
      if (ids.length > 0) {
        selectComponents(ids);
      }
    });
    
    canvas.on('selection:updated', (e) => {
      const selected = e.selected || [];
      const ids = selected
        .map(obj => (obj as unknown as { data?: { componentId?: string } }).data?.componentId)
        .filter((id): id is string => !!id);
      
      if (ids.length > 0) {
        selectComponents(ids);
      }
    });

    canvas.on('selection:cleared', () => {
      selectComponent(null);
    });

    // Register export function
    setFinalCanvasExportFn(() => {
      if (!fabricRef.current) return '';
      // Temporarily clear selection to avoid exporting selection handles
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
      
      return fabricRef.current.toDataURL({
        format: 'png',
        multiplier: 4, // High resolution (increased from 2)
      });
    });

    return () => {
      setFinalCanvasExportFn(null);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [selectComponents, selectComponent, setFinalCanvasExportFn]);

  // Update canvas background for dark mode
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.backgroundColor = isDarkMode ? '#1e293b' : '#ffffff';
    fabricRef.current.renderAll();
  }, [isDarkMode]);

  // Render the complete template
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    canvas.clear();
    canvas.backgroundColor = isDarkMode ? '#1e293b' : '#ffffff';

    const textColor = isDarkMode ? '#e2e8f0' : '#1f2937';
    const borderColor = isDarkMode ? '#475569' : '#e5e7eb';
    const primaryColor = '#1e7ac9';

    // Helper to create persisted text
    const createPersistedText = (id: string, text: string, options: any) => {
      const saved = finalTextConfig[id] || {};
      const fabricText = new fabric.Text(saved.text || text, {
        ...options,
        ...saved,
        data: { id },
      });
      
      fabricText.on('modified', () => {
        updateFinalTextConfig(id, {
          left: fabricText.left,
          top: fabricText.top,
          scaleX: fabricText.scaleX,
          scaleY: fabricText.scaleY,
          angle: fabricText.angle,
        });
      });
      
      return fabricText;
    };

    // === HEADER ===
    // Company name
    const companyName = createPersistedText('header_companyName', branding.companyName, {
      left: MARGIN,
      top: MARGIN,
      fontSize: 18 * CANVAS_SCALE / 2,
      fill: primaryColor,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      selectable: true,
      evented: true,
    });
    canvas.add(companyName);

    // Document title
    const docTitle = createPersistedText('header_docTitle', 'Pallet Specification Drawing', {
      left: MARGIN,
      top: MARGIN + 25 * CANVAS_SCALE / 2,
      fontSize: 14 * CANVAS_SCALE / 2,
      fill: textColor,
      fontFamily: 'Arial',
      selectable: true,
      evented: true,
    });
    canvas.add(docTitle);

    // Template and date (right side)
    const today = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const templateText = createPersistedText('header_templateText', `Template: ${currentPreset.toUpperCase()}`, {
      left: TEMPLATE_WIDTH - MARGIN,
      top: MARGIN,
      fontSize: 9 * CANVAS_SCALE / 2,
      fill: isDarkMode ? '#94a3b8' : '#6b7280',
      fontFamily: 'Arial',
      originX: 'right',
      selectable: true,
      evented: true,
    });
    canvas.add(templateText);

    const dateText = createPersistedText('header_dateText', `Date: ${today}`, {
      left: TEMPLATE_WIDTH - MARGIN,
      top: MARGIN + 12 * CANVAS_SCALE / 2,
      fontSize: 9 * CANVAS_SCALE / 2,
      fill: isDarkMode ? '#94a3b8' : '#6b7280',
      fontFamily: 'Arial',
      originX: 'right',
      selectable: true,
      evented: true,
    });
    canvas.add(dateText);

    // Header line
    const headerY = MARGIN + 45 * CANVAS_SCALE / 2;
    const headerLine = new fabric.Line([MARGIN, headerY, TEMPLATE_WIDTH - MARGIN, headerY], {
      stroke: primaryColor,
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
    });
    canvas.add(headerLine);

    // === SPECIFICATIONS BOX ===
    const specBoxTop = headerY + 4 * CANVAS_SCALE / 2;
    const specBoxHeight = TEMPLATE_HEIGHT - specBoxTop - MARGIN - 10 * CANVAS_SCALE / 2;
    
    const specBox = new fabric.Rect({
      left: MARGIN,
      top: specBoxTop,
      width: SPEC_BOX_WIDTH,
      height: specBoxHeight,
      fill: isDarkMode ? '#1e293b' : '#f8fafc',
      stroke: borderColor,
      strokeWidth: 0.5,
      rx: 2,
      ry: 2,
      selectable: false,
      evented: false,
    });
    canvas.add(specBox);

    // Specs title
    const specsTitle = createPersistedText('specs_title', 'SPECIFICATIONS', {
      left: MARGIN + 3 * CANVAS_SCALE / 2,
      top: specBoxTop + 6 * CANVAS_SCALE / 2,
      fontSize: 10 * CANVAS_SCALE / 2,
      fill: primaryColor,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      selectable: true,
      evented: true,
    });
    canvas.add(specsTitle);

    // Specs content
    let specY = specBoxTop + 16 * CANVAS_SCALE / 2;
    const specLineHeight = 10 * CANVAS_SCALE / 2;
    const specX = MARGIN + 3 * CANVAS_SCALE / 2;
    let specCounter = 0;

    // Dimensions
    const addSpecLabel = (label: string, bold = false) => {
      const text = createPersistedText(`spec_label_${specCounter++}`, label, {
        left: specX,
        top: specY,
        fontSize: 8 * CANVAS_SCALE / 2,
        fill: textColor,
        fontFamily: 'Arial',
        fontWeight: bold ? 'bold' : 'normal',
        selectable: true,
        evented: true,
      });
      canvas.add(text);
      specY += specLineHeight;
    };

    addSpecLabel('Dimensions', true);
    addSpecLabel(`L x W x H: ${specification.overallDimensions.length} x ${specification.overallDimensions.width} x ${specification.overallDimensions.height} mm`);
    specY += specLineHeight * 0.5;

    addSpecLabel('Classification', true);
    addSpecLabel(`Type: ${specification.classification.type}`);
    addSpecLabel(`Face: ${specification.classification.face}`);
    addSpecLabel(`Entry: ${specification.classification.entry}`);
    specY += specLineHeight * 0.5;

    addSpecLabel('Materials', true);
    addSpecLabel(`Lumber: ${specification.materials.lumberId}`);
    addSpecLabel(`Surface: ${specification.materials.surface}`);
    specY += specLineHeight * 0.5;

    addSpecLabel('Load Capacity', true);
    addSpecLabel(`Static: ${specification.materials.staticLoadCapacity} kg`);
    addSpecLabel(`Dynamic: ${specification.materials.dynamicLoadCapacity} kg`);
    specY += specLineHeight * 0.5;

    addSpecLabel('Components', true);
    VIEWS.forEach((view) => {
      addSpecLabel(`${VIEW_LABELS[view].label}: ${components[view].length}`);
    });

    // === VIEW GRID ===
    const viewAreaLeft = MARGIN + SPEC_BOX_WIDTH + 8 * CANVAS_SCALE / 2;
    const viewAreaWidth = TEMPLATE_WIDTH - viewAreaLeft - MARGIN;
    const viewAreaTop = specBoxTop;
    const viewAreaHeight = specBoxHeight;

    // 2x2 grid of views
    const viewWidth = (viewAreaWidth - VIEW_GAP) / 2;
    const viewHeight = (viewAreaHeight - VIEW_GAP) / 2;

    const viewPositions = [
      { x: viewAreaLeft, y: viewAreaTop, view: 'top' as ViewType },
      { x: viewAreaLeft + viewWidth + VIEW_GAP, y: viewAreaTop, view: 'side' as ViewType },
      { x: viewAreaLeft, y: viewAreaTop + viewHeight + VIEW_GAP, view: 'end' as ViewType },
      { x: viewAreaLeft + viewWidth + VIEW_GAP, y: viewAreaTop + viewHeight + VIEW_GAP, view: 'bottom' as ViewType },
    ];

    viewPositions.forEach((pos) => {
      // View background
      const viewBg = new fabric.Rect({
        left: pos.x,
        top: pos.y,
        width: viewWidth,
        height: viewHeight,
        fill: isDarkMode ? '#0f172a' : '#ffffff',
        stroke: borderColor,
        strokeWidth: 0.5,
        rx: 1,
        ry: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(viewBg);

      // View title bar
      const titleBar = new fabric.Rect({
        left: pos.x,
        top: pos.y,
        width: viewWidth,
        height: 10 * CANVAS_SCALE / 2,
        fill: isDarkMode ? '#1e293b' : '#f1f5f9',
        rx: 1,
        ry: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(titleBar);

      // View title
      const viewTitle = new fabric.Text(`${VIEW_LABELS[pos.view].label} (${VIEW_LABELS[pos.view].arrow})`, {
        left: pos.x + 2 * CANVAS_SCALE / 2,
        top: pos.y + 2.5 * CANVAS_SCALE / 2,
        fontSize: 7 * CANVAS_SCALE / 2,
        fill: primaryColor,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        selectable: true,
        evented: true,
      });
      canvas.add(viewTitle);

      // Render components for this view
      const viewComponents = components[pos.view];
      const viewAnnotations = annotations[pos.view];

      // Calculate scale to fit A4 content in view area
      const contentArea = {
        x: pos.x + 1 * CANVAS_SCALE / 2,
        y: pos.y + 11 * CANVAS_SCALE / 2,
        width: viewWidth - 2 * CANVAS_SCALE / 2,
        height: viewHeight - 12 * CANVAS_SCALE / 2,
      };

      // Calculate bounding box of content (components + annotations)
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let hasContent = false;

      // Helper to expand bounds
      const expandBounds = (x: number, y: number, w: number, h: number, rotation = 0) => {
        hasContent = true;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        
        // Dimensions of the bounding box of the rotated object
        const bbW = w * cos + h * sin;
        const bbH = w * sin + h * cos;
        
        // Center of the object (x,y is unrotated top-left)
        const cx = x + w / 2;
        const cy = y + h / 2;
        
        // Top-left of the bounding box
        const bbX = cx - bbW / 2;
        const bbY = cy - bbH / 2;
        
        minX = Math.min(minX, bbX);
        minY = Math.min(minY, bbY);
        maxX = Math.max(maxX, bbX + bbW);
        maxY = Math.max(maxY, bbY + bbH);
      };

      viewComponents.forEach((comp) => {
        expandBounds(
          comp.position.x * CANVAS_SCALE, 
          comp.position.y * CANVAS_SCALE, 
          comp.dimensions.width * CANVAS_SCALE, 
          comp.dimensions.length * CANVAS_SCALE,
          comp.rotation
        );
      });

      viewAnnotations.forEach((ann) => {
        if (ann.type === 'text') {
          // Estimate text size (rough approx)
          expandBounds(ann.position.x * CANVAS_SCALE, ann.position.y * CANVAS_SCALE, 50, 20, ann.rotation);
        } else if (ann.type === 'dimension') {
          minX = Math.min(minX, ann.startPosition.x * CANVAS_SCALE, ann.endPosition.x * CANVAS_SCALE);
          minY = Math.min(minY, ann.startPosition.y * CANVAS_SCALE, ann.endPosition.y * CANVAS_SCALE);
          maxX = Math.max(maxX, ann.startPosition.x * CANVAS_SCALE, ann.endPosition.x * CANVAS_SCALE);
          maxY = Math.max(maxY, ann.startPosition.y * CANVAS_SCALE, ann.endPosition.y * CANVAS_SCALE);
          hasContent = true;
        } else if (ann.type === 'callout') {
          minX = Math.min(minX, ann.anchorPosition.x * CANVAS_SCALE, ann.textPosition.x * CANVAS_SCALE);
          minY = Math.min(minY, ann.anchorPosition.y * CANVAS_SCALE, ann.textPosition.y * CANVAS_SCALE);
          maxX = Math.max(maxX, ann.anchorPosition.x * CANVAS_SCALE, ann.textPosition.x * CANVAS_SCALE + 80); // box width
          maxY = Math.max(maxY, ann.anchorPosition.y * CANVAS_SCALE, ann.textPosition.y * CANVAS_SCALE + 30); // box height
          hasContent = true;
        }
      });

      // If no content, fallback to A4 bounds
      if (!hasContent) {
        minX = 0;
        minY = 0;
        maxX = A4_WIDTH_PX;
        maxY = A4_HEIGHT_PX;
      }

      // Add padding (5%)
      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const padding = Math.max(contentW, contentH) * 0.05;
      
      minX -= padding;
      minY -= padding;
      const paddedW = contentW + padding * 2;
      const paddedH = contentH + padding * 2;

      // Calculate scale to fit content in view area
      const contentAspect = paddedW / paddedH;
      const viewAspect = contentArea.width / contentArea.height;
      
      let viewScale: number;
      let offsetX = 0;
      let offsetY = 0;

      // Check if we have stored config for this view
      const storedConfig = finalViewConfig[pos.view];
      
      // If stored config exists and is not default (scale 1, x 0, y 0 is default but we want to check if it was modified)
      // Actually, we should check if we have a valid config. 
      // The initial state in store is { x: 0, y: 0, scale: 1 } which is "uninitialized" for our auto-scale logic.
      // We can use a flag or check if scale is 1 (which is unlikely for auto-scale).
      // Let's assume if scale is 1 and x/y are 0, it's uninitialized.
      const isConfigured = storedConfig.scale !== 1 || storedConfig.x !== 0 || storedConfig.y !== 0;

      if (isConfigured) {
        viewScale = storedConfig.scale;
        // The stored X/Y are offsets from the center of the view box
        // We need to convert them back to our rendering coordinates
        // Our rendering logic uses contentArea.x + offsetX + ...
        // Let's redefine how we use the stored config.
        // We will treat stored X/Y as "pan" offsets applied to the auto-centered position.
        // Wait, if we want persistence, we should store the *result* of the calculation.
        
        // Actually, let's stick to the auto-scale logic as the "base" and apply user interaction on top.
        // But the user wants persistence of "location".
        // If we re-calculate auto-scale every time, the "base" might change if content changes.
        // But if content changes, we probably WANT to re-center.
        // The user said: "when changing the location... and changed back... changes reset".
        // This implies they want their manual adjustments to stick.
        
        // Let's use the stored config as the source of truth if it exists.
        // But we need to initialize it correctly.
        
        // For now, let's just use the auto-scale logic to determine the initial state,
        // and if we have a stored config that is DIFFERENT from default, use that.
        // But wait, if the user hasn't moved it, we want auto-scale.
        // If they HAVE moved it, we want stored.
        
        // Let's calculate the auto-scale values first.
        let autoScale: number;
        let autoOffsetX: number;
        let autoOffsetY: number;

        if (contentAspect > viewAspect) {
          // Content is wider than view box (relative to aspect ratios)
          // Constrained by width
          autoScale = contentArea.width / paddedW;
          autoOffsetY = (contentArea.height - paddedH * autoScale) / 2;
          autoOffsetX = (contentArea.width - paddedW * autoScale) / 2;
        } else {
          // Content is taller than view box
          // Constrained by height
          autoScale = contentArea.height / paddedH;
          autoOffsetX = (contentArea.width - paddedW * autoScale) / 2;
          autoOffsetY = (contentArea.height - paddedH * autoScale) / 2;
        }

        if (isConfigured) {
          viewScale = storedConfig.scale;
          // We'll interpret stored X/Y as absolute offsets within the view box
          offsetX = storedConfig.x;
          offsetY = storedConfig.y;
        } else {
          viewScale = autoScale;
          offsetX = autoOffsetX;
          offsetY = autoOffsetY;
          
          // Save this initial auto-calculated state to store so we have a baseline
          // We need to do this in a useEffect or similar to avoid render loops.
          // But we can't call set state inside render.
          // We'll skip saving for now and just use the calculated values.
          // The interaction handler will save the new values when modified.
        }
      } else {
        // Fallback logic (same as above)
        if (contentAspect > viewAspect) {
          viewScale = contentArea.width / paddedW;
          offsetY = (contentArea.height - paddedH * viewScale) / 2;
          offsetX = (contentArea.width - paddedW * viewScale) / 2;
        } else {
          viewScale = contentArea.height / paddedH;
          offsetX = (contentArea.width - paddedW * viewScale) / 2;
          offsetY = (contentArea.height - paddedH * viewScale) / 2;
        }
      }

      // Create a group for the view content to allow manipulation
      const viewGroupObjects: fabric.Object[] = [];

      // Render components
      // Sort by Z-index to ensure correct layering
      const sortedComponents = [...viewComponents].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      sortedComponents.forEach((comp) => {
        const colors = comp.color || COMPONENT_COLORS[comp.type] || { fill: '#cccccc', stroke: '#999999' };
        const w = comp.dimensions.width * CANVAS_SCALE;
        const h = comp.dimensions.length * CANVAS_SCALE;
        
        // Position relative to the bounding box top-left (minX, minY)
        const relX = comp.position.x * CANVAS_SCALE - minX;
        const relY = comp.position.y * CANVAS_SCALE - minY;
        
        // We create objects at their relative position within the group
        // The group will be positioned at (contentArea.x + offsetX, contentArea.y + offsetY)
        // scaled by viewScale.
        
        const rect = new fabric.Rect({
          left: relX + w / 2,
          top: relY + h / 2,
          width: w,
          height: h,
          fill: colors.fill,
          stroke: colors.stroke,
          strokeWidth: 1,
          originX: 'center',
          originY: 'center',
          angle: comp.rotation || 0,
          selectable: false, // Components inside group are not individually selectable
          evented: false,
        });
        viewGroupObjects.push(rect);
      });

      // Render annotations
      viewAnnotations.forEach((ann) => {
        if (ann.type === 'text') {
          const relX = ann.position.x * CANVAS_SCALE - minX;
          const relY = ann.position.y * CANVAS_SCALE - minY;
          
          const text = new fabric.Text(ann.text || 'Text', {
            left: relX,
            top: relY,
            fontSize: (ann.fontSize || 14),
            fill: ann.color || textColor,
            fontFamily: 'Arial',
            fontWeight: ann.fontWeight || 'normal',
            angle: ann.rotation || 0,
            selectable: false,
            evented: false,
          });
          viewGroupObjects.push(text);
        } else if (ann.type === 'dimension') {
          const x1 = ann.startPosition.x * CANVAS_SCALE - minX;
          const y1 = ann.startPosition.y * CANVAS_SCALE - minY;
          const x2 = ann.endPosition.x * CANVAS_SCALE - minX;
          const y2 = ann.endPosition.y * CANVAS_SCALE - minY;
          
          const line = new fabric.Line([x1, y1, x2, y2], {
            stroke: '#3b82f6',
            strokeWidth: 1.5,
            selectable: false,
            evented: false,
          });
          viewGroupObjects.push(line);

          // Dimension text
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const dimText = new fabric.Text(`${Math.round(ann.value)} mm`, {
            left: midX,
            top: midY - 6,
            fontSize: 9,
            fill: '#3b82f6',
            fontFamily: 'Arial',
            originX: 'center',
            selectable: false,
            evented: false,
          });
          viewGroupObjects.push(dimText);
        }
      });

      // Create the group
      if (viewGroupObjects.length > 0) {
        const group = new fabric.Group(viewGroupObjects, {
          left: contentArea.x + offsetX,
          top: contentArea.y + offsetY,
          scaleX: viewScale,
          scaleY: viewScale,
          originX: 'left',
          originY: 'top',
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: true, // Prevent rotation of the whole view
          subTargetCheck: false,
          interactive: true,
        });

        // Store view info for event handling
        (group as unknown as { data: { view: ViewType } }).data = { view: pos.view };

        // Handle modification (move/scale) to update store
        group.on('modified', () => {
          updateFinalViewConfig(pos.view, {
            x: group.left - contentArea.x, // Store offset relative to box origin
            y: group.top - contentArea.y,
            scale: group.scaleX || 1,
          });
        });

        canvas.add(group);
      }
    });

    // === FOOTER ===
    const footerY = TEMPLATE_HEIGHT - 8 * CANVAS_SCALE / 2;
    const footerText = createPersistedText('footer_text', `Generated by ${branding.companyName} Pallet Designer`, {
      left: MARGIN,
      top: footerY,
      fontSize: 7 * CANVAS_SCALE / 2,
      fill: isDarkMode ? '#64748b' : '#9ca3af',
      fontFamily: 'Arial',
      fontStyle: 'italic',
      selectable: true,
      evented: true,
    });
    canvas.add(footerText);

    const pageNum = createPersistedText('footer_pageNum', 'Page 1 of 1', {
      left: TEMPLATE_WIDTH - MARGIN,
      top: footerY,
      fontSize: 7 * CANVAS_SCALE / 2,
      fill: isDarkMode ? '#64748b' : '#9ca3af',
      fontFamily: 'Arial',
      fontStyle: 'italic',
      originX: 'right',
      selectable: true,
      evented: true,
    });
    canvas.add(pageNum);

    canvas.renderAll();
  }, [components, annotations, specification, branding, currentPreset, isDarkMode, finalViewConfig, updateFinalViewConfig, finalTextConfig, updateFinalTextConfig]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Canvas Area */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center bg-[var(--color-background)]"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      >
        <div className="relative p-8">
          {/* Canvas */}
          <div
            ref={wrapperRef}
            className="bg-white shadow-xl relative overflow-hidden"
            onContextMenu={onContextMenu}
            style={{
              width: displayWidth * zoom,
              height: displayHeight * zoom,
              transition: 'width 0.2s, height 0.2s',
            }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
          
          {/* Paper size label */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-muted)] whitespace-nowrap bg-[var(--color-background)] px-2 rounded">
            A4 Landscape (297 × 210 mm)
          </div>
        </div>
      </div>
    </div>
  );
}
