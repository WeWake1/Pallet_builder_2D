import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useStore, useActiveViewComponents } from '../../store/useStore';
import { useFabricCanvas } from '../../hooks/useFabricCanvas';
import { VIEW_LABELS, ZOOM_LIMITS, A4_WIDTH_PX, A4_HEIGHT_PX, COMPONENT_DEFINITIONS, CANVAS_SCALE, COMPONENT_COLORS } from '../../constants';
import type { ViewType, ComponentType } from '../../types';
import * as fabric from 'fabric';
import { ContextMenu } from './ContextMenu';

const VIEWS: ViewType[] = ['top', 'side', 'end', 'bottom'];

// Small preview component for each view
function ViewPreview({ view, isActive, onClick }: { view: ViewType; isActive: boolean; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.StaticCanvas | null>(null);
  const { components } = useStore();
  const viewComponents = components[view];

  // Initialize static canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.StaticCanvas(canvasRef.current, {
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      backgroundColor: '#ffffff',
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Render components
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    viewComponents.forEach((comp) => {
      const colors = COMPONENT_COLORS[comp.type] || { fill: '#cccccc', stroke: '#999999' };
      const w = comp.dimensions.width * CANVAS_SCALE;
      const h = comp.dimensions.length * CANVAS_SCALE;
      const x = comp.position.x * CANVAS_SCALE;
      const y = comp.position.y * CANVAS_SCALE;

      const rect = new fabric.Rect({
        left: x,
        top: y,
        width: w,
        height: h,
        fill: colors.fill,
        stroke: colors.stroke,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(rect);
    });

    canvas.renderAll();
  }, [viewComponents]);

  const scale = 0.12; // Small preview scale

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-1 rounded transition-all ${
        isActive 
          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-[var(--color-primary)]' 
          : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 shadow-sm overflow-hidden" style={{ width: A4_WIDTH_PX * scale, height: A4_HEIGHT_PX * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
      <span className={`text-xs mt-1 ${isActive ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-muted)]'}`}>
        {VIEW_LABELS[view].label.replace(' View', '')}
      </span>
    </button>
  );
}

export function MultiViewCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { canvas, setActiveView, setZoom, deleteComponent, deleteAnnotation, selectedComponentIds, selectedAnnotationId, addComponent, bringToFront, bringForward, sendToBack, sendBackward, undo, copyComponent, pasteComponent } = useStore();
  const { activeView, zoom } = canvas;
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string | null; annotationId: string | null } | null>(null);
  const viewComponents = useActiveViewComponents();

  const canvasWidth = A4_WIDTH_PX;
  const canvasHeight = A4_HEIGHT_PX;

  const { displayWidth, displayHeight, scale } = useMemo(() => {
    const a4AspectRatio = 210 / 297;
    let width: number;
    let height: number;

    if (containerSize.height > 0) {
      if (containerSize.width / containerSize.height > a4AspectRatio) {
        height = Math.min(containerSize.height - 100, 600);
        width = height * a4AspectRatio;
      } else {
        width = Math.min(containerSize.width - 140, 400);
        height = width / a4AspectRatio;
      }
    } else {
      width = 350;
      height = 495;
    }

    return {
      displayWidth: width,
      displayHeight: height,
      scale: (width * zoom) / canvasWidth,
    };
  }, [containerSize, zoom, canvasWidth]);

  useFabricCanvas({
    canvasRef,
    width: canvasWidth,
    height: canvasHeight,
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle delete for multiple selected components and layer ordering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedComponentIds.length > 0) {
        e.preventDefault();
        copyComponent(selectedComponentIds[0]);
        return;
      }
      
      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteComponent();
        return;
      }
      
      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedComponentIds.length > 0) {
        e.preventDefault();
        const { duplicateComponent } = useStore.getState();
        duplicateComponent(selectedComponentIds[0]);
        return;
      }
      
      // Delete key - handle both components and annotations
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedComponentIds.length > 0 || selectedAnnotationId)) {
        e.preventDefault();
        // Delete all selected components
        selectedComponentIds.forEach((id) => deleteComponent(id));
        // Delete selected annotation if any
        if (selectedAnnotationId) {
          deleteAnnotation(selectedAnnotationId);
        }
      }
      
      // Layer ordering shortcuts (like Excalidraw)
      // Ctrl+] or Cmd+] - Bring Forward
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && !e.shiftKey && selectedComponentIds.length > 0) {
        e.preventDefault();
        selectedComponentIds.forEach((id) => bringForward(id));
      }
      
      // Ctrl+[ or Cmd+[ - Send Backward
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && !e.shiftKey && selectedComponentIds.length > 0) {
        e.preventDefault();
        selectedComponentIds.forEach((id) => sendBackward(id));
      }
      
      // Ctrl+Shift+] or Cmd+Shift+] - Bring to Front
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']' && selectedComponentIds.length > 0) {
        e.preventDefault();
        selectedComponentIds.forEach((id) => bringToFront(id));
      }
      
      // Ctrl+Shift+[ or Cmd+Shift+[ - Send to Back
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[' && selectedComponentIds.length > 0) {
        e.preventDefault();
        selectedComponentIds.forEach((id) => sendToBack(id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentIds, selectedAnnotationId, deleteComponent, deleteAnnotation, bringToFront, bringForward, sendToBack, sendBackward, undo, copyComponent, pasteComponent]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_LIMITS.step : ZOOM_LIMITS.step;
      setZoom(zoom + delta);
    }
  }, [zoom, setZoom]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!canvasWrapperRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const componentType = e.dataTransfer.getData('componentType') as ComponentType;
    if (!componentType) return;

    const definition = COMPONENT_DEFINITIONS.find((d) => d.type === componentType);
    if (!definition) return;

    const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    const dropX = e.clientX - wrapperRect.left;
    const dropY = e.clientY - wrapperRect.top;
    
    const canvasX = dropX / scale;
    const canvasY = dropY / scale;
    
    const xMm = Math.round(canvasX / CANVAS_SCALE);
    const yMm = Math.round(canvasY / CANVAS_SCALE);
    
    const posX = Math.max(0, Math.min(210 - definition.defaultDimensions.width, xMm - definition.defaultDimensions.width / 2));
    const posY = Math.max(0, Math.min(297 - definition.defaultDimensions.length, yMm - definition.defaultDimensions.length / 2));

    addComponent({
      type: componentType,
      dimensions: { ...definition.defaultDimensions },
      position: { x: posX, y: posY },
      rotation: 0,
      view: activeView,
    });
  }, [addComponent, activeView, scale]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if clicked on a selected component or annotation
    const componentId = selectedComponentIds.length > 0 ? selectedComponentIds[0] : null;
    const annotationId = selectedAnnotationId;
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId,
      annotationId,
    });
  }, [selectedComponentIds, selectedAnnotationId]);

  // Close context menu when clicking elsewhere
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[var(--color-background)] overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {VIEW_LABELS[activeView].label}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded">
            {VIEW_LABELS[activeView].arrow}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            • {viewComponents.length} component{viewComponents.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom - ZOOM_LIMITS.step)}
            disabled={zoom <= ZOOM_LIMITS.min}
            className="w-8 h-8 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-[var(--color-text)] min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + ZOOM_LIMITS.step)}
            disabled={zoom >= ZOOM_LIMITS.max}
            className="w-8 h-8 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="ml-2 text-xs text-[var(--color-primary)] hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content - Canvas + View Previews */}
      <div className="flex-1 flex overflow-hidden">
        {/* View Previews Panel */}
        <div className="shrink-0 w-20 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-2 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs text-center text-[var(--color-text-muted)] font-medium mb-1">Views</div>
          {VIEWS.map((view) => (
            <ViewPreview
              key={view}
              view={view}
              isActive={activeView === view}
              onClick={() => setActiveView(view)}
            />
          ))}
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-4"
          onWheel={handleWheel}
        >
          <div className="relative">
            <div
              ref={canvasWrapperRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onContextMenu={handleContextMenu}
              className={`bg-white shadow-lg relative overflow-hidden transition-all ${
                isDragOver ? 'ring-4 ring-[var(--color-primary)] ring-opacity-50' : ''
              }`}
              style={{
                width: displayWidth * zoom,
                height: displayHeight * zoom,
                transition: 'width 0.2s, height 0.2s',
              }}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <canvas ref={canvasRef} />
              </div>

              {isDragOver && (
                <div className="absolute inset-0 bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center pointer-events-none">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-[var(--color-primary)]">
                    Drop to add component
                  </div>
                </div>
              )}

              {viewComponents.length === 0 && !isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-[var(--color-text-muted)]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <p className="text-sm">Drag components here</p>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
              A4 (210 × 297 mm)
            </div>
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          componentId={contextMenu.componentId}
          annotationId={contextMenu.annotationId}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
