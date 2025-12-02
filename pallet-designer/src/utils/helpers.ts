import { CANVAS_SCALE } from '../constants';

/**
 * Convert millimeters to canvas pixels
 */
export const mmToPixels = (mm: number): number => {
  return mm * CANVAS_SCALE;
};

/**
 * Convert canvas pixels to millimeters
 */
export const pixelsToMm = (pixels: number): number => {
  return pixels / CANVAS_SCALE;
};

/**
 * Snap a value to the nearest grid point
 */
export const snapToGrid = (value: number, gridSize: number, enabled: boolean): number => {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format dimensions for display
 */
export const formatDimensions = (length: number, width: number, height?: number): string => {
  if (height !== undefined) {
    return `${length} × ${width} × ${height} mm`;
  }
  return `${length} × ${width} mm`;
};

/**
 * Calculate distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Check if a point is inside a rectangle
 */
export const pointInRect = (
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean => {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if device is touch-enabled
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get viewport dimensions
 */
export const getViewportDimensions = (): { width: number; height: number } => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};
