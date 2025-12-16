import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { CANVAS_SCALE } from '../../constants';

interface WorkspaceRulerProps {
  orientation: 'horizontal' | 'vertical';
  containerSize: number; // Width for horizontal, height for vertical (full workspace size)
  canvasOffset: number; // Offset from ruler start to canvas start
  canvasSize: number; // Size of the canvas in pixels (after zoom)
  zoom: number;
  cursorPosition?: { x: number; y: number } | null;
}

const RULER_SIZE = 24; // pixels - slightly larger for better visibility
const MAJOR_TICK_INTERVAL = 10; // mm
const MINOR_TICK_INTERVAL = 5; // mm

export function WorkspaceRuler({ 
  orientation, 
  containerSize, 
  canvasOffset, 
  canvasSize,
  zoom,
  cursorPosition 
}: WorkspaceRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { canvas: canvasState } = useStore();
  const isDarkMode = canvasState.darkMode;
  
  // Colors based on theme
  const colors = useMemo(() => ({
    background: isDarkMode ? '#1e293b' : '#f1f5f9',
    backgroundOutside: isDarkMode ? '#0f172a' : '#e2e8f0',
    text: isDarkMode ? '#94a3b8' : '#475569',
    tick: isDarkMode ? '#475569' : '#94a3b8',
    majorTick: isDarkMode ? '#64748b' : '#64748b',
    cursorLine: '#1e7ac9',
    cursorBg: 'rgba(30, 122, 201, 0.3)',
    canvasHighlight: isDarkMode ? '#334155' : '#ffffff',
  }), [isDarkMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size with device pixel ratio for crisp rendering
    if (orientation === 'horizontal') {
      canvas.width = containerSize * dpr;
      canvas.height = RULER_SIZE * dpr;
      canvas.style.width = `${containerSize}px`;
      canvas.style.height = `${RULER_SIZE}px`;
    } else {
      canvas.width = RULER_SIZE * dpr;
      canvas.height = containerSize * dpr;
      canvas.style.width = `${RULER_SIZE}px`;
      canvas.style.height = `${containerSize}px`;
    }
    
    ctx.scale(dpr, dpr);
    
    // Fill background for areas outside canvas
    ctx.fillStyle = colors.backgroundOutside;
    ctx.fillRect(0, 0, orientation === 'horizontal' ? containerSize : RULER_SIZE, 
                       orientation === 'horizontal' ? RULER_SIZE : containerSize);
    
    // Highlight the canvas area
    ctx.fillStyle = colors.background;
    if (orientation === 'horizontal') {
      ctx.fillRect(canvasOffset, 0, canvasSize, RULER_SIZE);
    } else {
      ctx.fillRect(0, canvasOffset, RULER_SIZE, canvasSize);
    }
    
    // Draw border at the edge of ruler
    ctx.strokeStyle = colors.tick;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (orientation === 'horizontal') {
      ctx.moveTo(0, RULER_SIZE - 0.5);
      ctx.lineTo(containerSize, RULER_SIZE - 0.5);
    } else {
      ctx.moveTo(RULER_SIZE - 0.5, 0);
      ctx.lineTo(RULER_SIZE - 0.5, containerSize);
    }
    ctx.stroke();
    
    // Only draw tick marks within the canvas area
    const scale = zoom * CANVAS_SCALE;
    
    // Calculate the mm range visible
    const startMm = 0;
    const endMm = orientation === 'horizontal' ? 210 : 297; // A4 dimensions in mm
    
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let mm = startMm; mm <= endMm; mm += 1) {
      const pos = canvasOffset + (mm * scale);
      
      // Skip if outside container
      if (pos < 0 || pos > containerSize) continue;
      
      const isMajor = mm % MAJOR_TICK_INTERVAL === 0;
      const isMinor = mm % MINOR_TICK_INTERVAL === 0;
      
      if (!isMajor && !isMinor) continue;
      
      const tickLength = isMajor ? RULER_SIZE * 0.5 : RULER_SIZE * 0.25;
      ctx.strokeStyle = isMajor ? colors.majorTick : colors.tick;
      ctx.lineWidth = isMajor ? 1 : 0.5;
      
      ctx.beginPath();
      if (orientation === 'horizontal') {
        ctx.moveTo(pos, RULER_SIZE);
        ctx.lineTo(pos, RULER_SIZE - tickLength);
      } else {
        ctx.moveTo(RULER_SIZE, pos);
        ctx.lineTo(RULER_SIZE - tickLength, pos);
      }
      ctx.stroke();
      
      // Draw labels for major ticks
      if (isMajor) {
        ctx.fillStyle = colors.text;
        if (orientation === 'horizontal') {
          ctx.fillText(String(mm), pos, 2);
        } else {
          ctx.save();
          ctx.translate(11, pos);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.fillText(String(mm), 0, 0);
          ctx.restore();
        }
      }
    }
    
    // Draw cursor position indicator
    if (cursorPosition) {
      const cursorMm = orientation === 'horizontal' ? cursorPosition.x : cursorPosition.y;
      const cursorPos = canvasOffset + (cursorMm * scale);
      
      if (cursorPos >= canvasOffset && cursorPos <= canvasOffset + canvasSize) {
        // Draw highlight background
        ctx.fillStyle = colors.cursorBg;
        if (orientation === 'horizontal') {
          ctx.fillRect(cursorPos - 15, 0, 30, RULER_SIZE);
        } else {
          ctx.fillRect(0, cursorPos - 15, RULER_SIZE, 30);
        }
        
        // Draw line
        ctx.strokeStyle = colors.cursorLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (orientation === 'horizontal') {
          ctx.moveTo(cursorPos, 0);
          ctx.lineTo(cursorPos, RULER_SIZE);
        } else {
          ctx.moveTo(0, cursorPos);
          ctx.lineTo(RULER_SIZE, cursorPos);
        }
        ctx.stroke();
        
        // Draw position value with background for readability
        const posValue = Math.round(cursorMm);
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textWidth = ctx.measureText(`${posValue}`).width;
        
        if (orientation === 'horizontal') {
          ctx.fillStyle = colors.cursorLine;
          ctx.fillRect(cursorPos - textWidth/2 - 3, 1, textWidth + 6, 12);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(`${posValue}`, cursorPos, 2);
        } else {
          ctx.save();
          ctx.translate(12, cursorPos);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = colors.cursorLine;
          ctx.fillRect(-textWidth/2 - 3, -11, textWidth + 6, 12);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(`${posValue}`, 0, -1);
          ctx.restore();
        }
      }
    }
  }, [orientation, containerSize, canvasOffset, canvasSize, zoom, colors, cursorPosition]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas 
      ref={canvasRef} 
      className="shrink-0 pointer-events-none"
    />
  );
}
