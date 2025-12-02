import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useStore, useActiveViewComponents } from '../../store/useStore';
import { useFabricCanvas } from '../../hooks/useFabricCanvas';
import { VIEW_LABELS, ZOOM_LIMITS, A4_WIDTH_PX, A4_HEIGHT_PX, COMPONENT_DEFINITIONS, CANVAS_SCALE } from '../../constants';
import type { ComponentType } from '../../types';

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { canvas, setZoom, deleteComponent, selectedComponentId, addComponent } = useStore();
  const { activeView, zoom, gridEnabled } = canvas;
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const viewComponents = useActiveViewComponents();

  // Calculate canvas dimensions
  const canvasWidth = A4_WIDTH_PX;
  const canvasHeight = A4_HEIGHT_PX;

  // Calculate display size based on container (memoized)
  const { displayWidth, displayHeight, scale } = useMemo(() => {
    const a4AspectRatio = 210 / 297;
    let width: number;
    let height: number;

    if (containerSize.height > 0) {
      if (containerSize.width / containerSize.height > a4AspectRatio) {
        height = Math.min(containerSize.height - 100, 700);
        width = height * a4AspectRatio;
      } else {
        width = Math.min(containerSize.width - 60, 500);
        height = width / a4AspectRatio;
      }
    } else {
      width = 420;
      height = 594;
    }

    return {
      displayWidth: width,
      displayHeight: height,
      scale: (width * zoom) / canvasWidth,
    };
  }, [containerSize, zoom, canvasWidth]);

  // Initialize Fabric.js canvas
  useFabricCanvas({
    canvasRef,
    width: canvasWidth,
    height: canvasHeight,
  });

  // Update container size on resize
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        e.preventDefault();
        deleteComponent(selectedComponentId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, deleteComponent]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_LIMITS.step : ZOOM_LIMITS.step;
      setZoom(zoom + delta);
    }
  }, [zoom, setZoom]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set to false if we're leaving the wrapper entirely
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

    // Calculate drop position relative to canvas
    const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    // Get drop position in pixels (in canvas wrapper coordinates)
    const dropX = e.clientX - wrapperRect.left;
    const dropY = e.clientY - wrapperRect.top;
    
    // Convert to canvas coordinates (accounting for zoom and scale)
    const canvasX = dropX / scale;
    const canvasY = dropY / scale;
    
    // Convert pixels to mm (dividing by CANVAS_SCALE since we use 2px per mm)
    const xMm = Math.round(canvasX / CANVAS_SCALE);
    const yMm = Math.round(canvasY / CANVAS_SCALE);
    
    // Center the component on the drop point
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

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-gray-100 overflow-hidden"
    >
      {/* View Title Bar */}
      <div className="shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {VIEW_LABELS[activeView].label}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] bg-gray-100 px-2 py-0.5 rounded">
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
            className="w-8 h-8 rounded border border-[var(--color-border)] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="w-8 h-8 rounded border border-[var(--color-border)] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Canvas Container */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        onWheel={handleWheel}
      >
        <div className="relative">
          {/* Canvas Wrapper with Shadow */}
          <div
            ref={canvasWrapperRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white shadow-lg relative overflow-hidden transition-all ${
              isDragOver ? 'ring-4 ring-[var(--color-primary)] ring-opacity-50' : ''
            }`}
            style={{
              width: displayWidth * zoom,
              height: displayHeight * zoom,
              transition: 'width 0.2s, height 0.2s',
            }}
          >
            {/* Grid Overlay (behind canvas) */}
            {gridEnabled && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #94a3b8 1px, transparent 1px),
                    linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * scale}px ${20 * scale}px`,
                }}
              />
            )}

            {/* Fabric.js Canvas */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <canvas ref={canvasRef} />
            </div>

            {/* Drag Over Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center pointer-events-none">
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-[var(--color-primary)]">
                  Drop to add component
                </div>
              </div>
            )}

            {/* Empty State Overlay */}
            {viewComponents.length === 0 && !isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-[var(--color-text-muted)]">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                  <p className="text-sm">
                    Drag components from sidebar or click to add
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    or select a preset template
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* A4 Dimensions Label */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            A4 (210 × 297 mm) • View: {VIEW_LABELS[activeView].arrow}
          </div>
        </div>
      </div>
    </div>
  );
}
