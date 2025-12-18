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

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [selectComponents, selectComponent]);

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

    // === HEADER ===
    // Company name
    const companyName = new fabric.FabricText(branding.companyName, {
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
    const docTitle = new fabric.FabricText('Pallet Specification Drawing', {
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
    const templateText = new fabric.FabricText(`Template: ${currentPreset.toUpperCase()}`, {
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

    const dateText = new fabric.FabricText(`Date: ${today}`, {
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
    const specsTitle = new fabric.FabricText('SPECIFICATIONS', {
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
    const specLineHeight = 5 * CANVAS_SCALE / 2;
    const specX = MARGIN + 3 * CANVAS_SCALE / 2;

    // Dimensions
    const addSpecLabel = (label: string, bold = false) => {
      const text = new fabric.FabricText(label, {
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
      const viewTitle = new fabric.FabricText(`${VIEW_LABELS[pos.view].label} (${VIEW_LABELS[pos.view].arrow})`, {
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

      // Scale to fit A4 (210x297mm) into the view area
      const a4Aspect = 210 / 297;
      const contentAspect = contentArea.width / contentArea.height;
      let viewScale: number;
      let offsetX = 0;
      let offsetY = 0;

      if (contentAspect > a4Aspect) {
        // Height constrained
        viewScale = contentArea.height / A4_HEIGHT_PX;
        offsetX = (contentArea.width - A4_WIDTH_PX * viewScale) / 2;
      } else {
        // Width constrained
        viewScale = contentArea.width / A4_WIDTH_PX;
        offsetY = (contentArea.height - A4_HEIGHT_PX * viewScale) / 2;
      }

      // Render components
      viewComponents.forEach((comp) => {
        const colors = comp.color || COMPONENT_COLORS[comp.type] || { fill: '#cccccc', stroke: '#999999' };
        const w = comp.dimensions.width * CANVAS_SCALE * viewScale;
        const h = comp.dimensions.length * CANVAS_SCALE * viewScale;
        const x = contentArea.x + offsetX + comp.position.x * CANVAS_SCALE * viewScale + w / 2;
        const y = contentArea.y + offsetY + comp.position.y * CANVAS_SCALE * viewScale + h / 2;

        const rect = new fabric.Rect({
          left: x,
          top: y,
          width: w,
          height: h,
          fill: colors.fill,
          stroke: colors.stroke,
          strokeWidth: 1,
          originX: 'center',
          originY: 'center',
          angle: comp.rotation || 0,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
        });

        // Store component reference
        (rect as unknown as { data: { id: string; view: ViewType; componentId: string } }).data = {
          id: `final-${pos.view}-${comp.id}`,
          view: pos.view,
          componentId: comp.id,
        };

        canvas.add(rect);
      });

      // Render annotations
      viewAnnotations.forEach((ann) => {
        if (ann.type === 'text') {
          const x = contentArea.x + offsetX + ann.position.x * CANVAS_SCALE * viewScale;
          const y = contentArea.y + offsetY + ann.position.y * CANVAS_SCALE * viewScale;
          const text = new fabric.FabricText(ann.text || 'Text', {
            left: x,
            top: y,
            fontSize: (ann.fontSize || 14) * viewScale,
            fill: ann.color || textColor,
            fontFamily: 'Arial',
            fontWeight: ann.fontWeight || 'normal',
            angle: ann.rotation || 0,
            selectable: true,
            evented: true,
          });
          canvas.add(text);
        } else if (ann.type === 'dimension') {
          const x1 = contentArea.x + offsetX + ann.startPosition.x * CANVAS_SCALE * viewScale;
          const y1 = contentArea.y + offsetY + ann.startPosition.y * CANVAS_SCALE * viewScale;
          const x2 = contentArea.x + offsetX + ann.endPosition.x * CANVAS_SCALE * viewScale;
          const y2 = contentArea.y + offsetY + ann.endPosition.y * CANVAS_SCALE * viewScale;
          
          const line = new fabric.Line([x1, y1, x2, y2], {
            stroke: '#3b82f6',
            strokeWidth: 1.5,
            selectable: true,
            evented: true,
          });
          canvas.add(line);

          // Dimension text
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const dimText = new fabric.FabricText(`${Math.round(ann.value)} mm`, {
            left: midX,
            top: midY - 6,
            fontSize: 9 * viewScale,
            fill: '#3b82f6',
            fontFamily: 'Arial',
            originX: 'center',
            selectable: true,
            evented: true,
          });
          canvas.add(dimText);
        }
      });
    });

    // === FOOTER ===
    const footerY = TEMPLATE_HEIGHT - 8 * CANVAS_SCALE / 2;
    const footerText = new fabric.FabricText(`Generated by ${branding.companyName} Pallet Designer`, {
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

    const pageNum = new fabric.FabricText('Page 1 of 1', {
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
  }, [components, annotations, specification, branding, currentPreset, isDarkMode]);

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
