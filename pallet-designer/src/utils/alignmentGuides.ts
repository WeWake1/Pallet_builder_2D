import * as fabric from 'fabric';

export interface AlignmentGuide {
  x?: number;
  y?: number;
  orientation: 'vertical' | 'horizontal';
  objects: fabric.FabricObject[];
}

export interface SnapResult {
  x?: number;
  y?: number;
  guides: AlignmentGuide[];
}

const SNAP_THRESHOLD = 5; // pixels - distance to trigger snap
const GUIDE_COLOR = '#ff4757'; // Figma-like red
const GUIDE_STROKE_WIDTH = 1;

/**
 * Calculate alignment guides for an object being moved
 * Checks alignment with other objects' edges and centers
 */
export function calculateAlignmentGuides(
  target: fabric.FabricObject,
  allObjects: fabric.FabricObject[],
  canvasWidth: number,
  canvasHeight: number
): SnapResult {
  const guides: AlignmentGuide[] = [];
  let snapX: number | undefined;
  let snapY: number | undefined;

  // Get target bounds
  const targetBounds = getObjectBounds(target);
  if (!targetBounds) return { guides };

  const { left, right, top, bottom, centerX, centerY } = targetBounds;

  // Canvas center lines
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  // Track best snap candidates
  let bestXSnap: { position: number; distance: number; objects: fabric.FabricObject[] } | null = null;
  let bestYSnap: { position: number; distance: number; objects: fabric.FabricObject[] } | null = null;

  // Check alignment with canvas center
  const distToCenterX = Math.abs(centerX - canvasCenterX);
  const distToCenterY = Math.abs(centerY - canvasCenterY);

  if (distToCenterX < SNAP_THRESHOLD) {
    bestXSnap = { position: canvasCenterX, distance: distToCenterX, objects: [] };
  }
  if (distToCenterY < SNAP_THRESHOLD) {
    bestYSnap = { position: canvasCenterY, distance: distToCenterY, objects: [] };
  }

  // Check alignment with other objects
  allObjects.forEach((obj) => {
    // Skip target itself, grid, labels, and non-visible objects
    if (obj === target || !obj.visible || obj.opacity === 0) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objData = (obj as any).data;
    if (objData?.isGrid || objData?.isLabel) return;

    const objBounds = getObjectBounds(obj);
    if (!objBounds) return;

    // Check vertical alignment (X positions)
    checkAlignment(left, objBounds.left, obj, 'x', bestXSnap, snapX);
    checkAlignment(left, objBounds.right, obj, 'x', bestXSnap, snapX);
    checkAlignment(left, objBounds.centerX, obj, 'x', bestXSnap, snapX);
    checkAlignment(right, objBounds.left, obj, 'x', bestXSnap, snapX);
    checkAlignment(right, objBounds.right, obj, 'x', bestXSnap, snapX);
    checkAlignment(right, objBounds.centerX, obj, 'x', bestXSnap, snapX);
    checkAlignment(centerX, objBounds.left, obj, 'x', bestXSnap, snapX);
    checkAlignment(centerX, objBounds.right, obj, 'x', bestXSnap, snapX);
    checkAlignment(centerX, objBounds.centerX, obj, 'x', bestXSnap, snapX);

    // Check horizontal alignment (Y positions)
    checkAlignment(top, objBounds.top, obj, 'y', bestYSnap, snapY);
    checkAlignment(top, objBounds.bottom, obj, 'y', bestYSnap, snapY);
    checkAlignment(top, objBounds.centerY, obj, 'y', bestYSnap, snapY);
    checkAlignment(bottom, objBounds.top, obj, 'y', bestYSnap, snapY);
    checkAlignment(bottom, objBounds.bottom, obj, 'y', bestYSnap, snapY);
    checkAlignment(bottom, objBounds.centerY, obj, 'y', bestYSnap, snapY);
    checkAlignment(centerY, objBounds.top, obj, 'y', bestYSnap, snapY);
    checkAlignment(centerY, objBounds.bottom, obj, 'y', bestYSnap, snapY);
    checkAlignment(centerY, objBounds.centerY, obj, 'y', bestYSnap, snapY);
  });

  // Apply best snaps and create guides
  if (bestXSnap) {
    snapX = bestXSnap.position;
    guides.push({
      x: bestXSnap.position,
      orientation: 'vertical',
      objects: bestXSnap.objects,
    });
  }

  if (bestYSnap) {
    snapY = bestYSnap.position;
    guides.push({
      y: bestYSnap.position,
      orientation: 'horizontal',
      objects: bestYSnap.objects,
    });
  }

  return { x: snapX, y: snapY, guides };
}

/**
 * Helper to check alignment and update best snap candidate
 */
function checkAlignment(
  targetPos: number,
  objPos: number,
  obj: fabric.FabricObject,
  _axis: 'x' | 'y',
  bestSnap: { position: number; distance: number; objects: fabric.FabricObject[] } | null,
  _currentSnap: number | undefined
): { position: number; distance: number; objects: fabric.FabricObject[] } | null {
  const distance = Math.abs(targetPos - objPos);
  
  if (distance < SNAP_THRESHOLD) {
    if (!bestSnap || distance < bestSnap.distance) {
      return { position: objPos, distance, objects: [obj] };
    } else if (Math.abs(distance - bestSnap.distance) < 0.5) {
      // Same distance - add to objects list
      bestSnap.objects.push(obj);
    }
  }
  
  return bestSnap;
}

/**
 * Get object bounds including rotation
 */
export function getObjectBounds(obj: fabric.FabricObject): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} | null {
  const coords = obj.aCoords;
  if (!coords) return null;

  const { tl, tr, bl, br } = coords;
  
  const left = Math.min(tl.x, tr.x, bl.x, br.x);
  const right = Math.max(tl.x, tr.x, bl.x, br.x);
  const top = Math.min(tl.y, tr.y, bl.y, br.y);
  const bottom = Math.max(tl.y, tr.y, bl.y, br.y);
  
  const width = right - left;
  const height = bottom - top;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  return { left, right, top, bottom, centerX, centerY, width, height };
}

/**
 * Create visual guide lines on canvas
 */
export function createGuideLines(
  canvas: fabric.Canvas,
  guides: AlignmentGuide[]
): fabric.Line[] {
  const lines: fabric.Line[] = [];
  const canvasWidth = canvas.width || 0;
  const canvasHeight = canvas.height || 0;

  guides.forEach((guide) => {
    let line: fabric.Line;

    if (guide.orientation === 'vertical' && guide.x !== undefined) {
      // Vertical line (for X alignment)
      line = new fabric.Line([guide.x, 0, guide.x, canvasHeight], {
        stroke: GUIDE_COLOR,
        strokeWidth: GUIDE_STROKE_WIDTH,
        selectable: false,
        evented: false,
        strokeDashArray: [5, 5],
        opacity: 0.8,
        excludeFromExport: true,
      });
    } else if (guide.orientation === 'horizontal' && guide.y !== undefined) {
      // Horizontal line (for Y alignment)
      line = new fabric.Line([0, guide.y, canvasWidth, guide.y], {
        stroke: GUIDE_COLOR,
        strokeWidth: GUIDE_STROKE_WIDTH,
        selectable: false,
        evented: false,
        strokeDashArray: [5, 5],
        opacity: 0.8,
        excludeFromExport: true,
      });
    } else {
      return;
    }

    // Mark as guide for easy removal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (line as any).data = { isGuide: true };
    lines.push(line);
  });

  return lines;
}

/**
 * Remove all guide lines from canvas
 */
export function clearGuideLines(canvas: fabric.Canvas): void {
  const objects = canvas.getObjects();
  objects.forEach((obj: fabric.FabricObject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (obj as any).data;
    if (data?.isGuide) {
      canvas.remove(obj);
    }
  });
}

/**
 * Apply snap to object position
 */
export function applySnap(
  obj: fabric.FabricObject,
  snapResult: SnapResult
): void {
  if (!snapResult.x && !snapResult.y) return;

  const bounds = getObjectBounds(obj);
  if (!bounds) return;

  const currentLeft = obj.left || 0;
  const currentTop = obj.top || 0;

  let newLeft = currentLeft;
  let newTop = currentTop;

  // Calculate offset from bounds to center (objects use center origin)
  const offsetX = currentLeft - bounds.centerX;
  const offsetY = currentTop - bounds.centerY;

  if (snapResult.x !== undefined) {
    // Snap center X to guide position
    newLeft = snapResult.x + offsetX;
  }

  if (snapResult.y !== undefined) {
    // Snap center Y to guide position
    newTop = snapResult.y + offsetY;
  }

  obj.set({
    left: newLeft,
    top: newTop,
  });
  obj.setCoords();
}

/**
 * Distribute objects evenly along an axis
 */
export function distributeObjects(
  objects: fabric.FabricObject[],
  axis: 'horizontal' | 'vertical'
): void {
  if (objects.length < 3) return; // Need at least 3 objects to distribute

  // Get bounds for all objects
  const bounds = objects
    .map((obj) => ({ obj, bounds: getObjectBounds(obj) }))
    .filter((item) => item.bounds !== null) as {
    obj: fabric.FabricObject;
    bounds: NonNullable<ReturnType<typeof getObjectBounds>>;
  }[];

  if (bounds.length < 3) return;

  // Sort by position
  if (axis === 'horizontal') {
    bounds.sort((a, b) => a.bounds.left - b.bounds.left);
  } else {
    bounds.sort((a, b) => a.bounds.top - b.bounds.top);
  }

  // Calculate total space and gap
  const first = bounds[0].bounds;
  const last = bounds[bounds.length - 1].bounds;

  if (axis === 'horizontal') {
    const totalWidth = bounds.reduce((sum, item) => sum + item.bounds.width, 0);
    const availableSpace = last.right - first.left - totalWidth;
    const gap = availableSpace / (bounds.length - 1);

    let currentX = first.left;
    bounds.forEach((item, index) => {
      if (index === 0 || index === bounds.length - 1) {
        // Don't move first and last
        currentX += item.bounds.width;
        return;
      }

      const offsetX = (item.obj.left || 0) - item.bounds.centerX;
      const newCenterX = currentX + item.bounds.width / 2;
      item.obj.set({ left: newCenterX + offsetX });
      item.obj.setCoords();

      currentX += item.bounds.width + gap;
    });
  } else {
    const totalHeight = bounds.reduce((sum, item) => sum + item.bounds.height, 0);
    const availableSpace = last.bottom - first.top - totalHeight;
    const gap = availableSpace / (bounds.length - 1);

    let currentY = first.top;
    bounds.forEach((item, index) => {
      if (index === 0 || index === bounds.length - 1) {
        // Don't move first and last
        currentY += item.bounds.height;
        return;
      }

      const offsetY = (item.obj.top || 0) - item.bounds.centerY;
      const newCenterY = currentY + item.bounds.height / 2;
      item.obj.set({ top: newCenterY + offsetY });
      item.obj.setCoords();

      currentY += item.bounds.height + gap;
    });
  }
}

/**
 * Align objects along an edge or center
 */
export function alignObjects(
  objects: fabric.FabricObject[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): void {
  if (objects.length < 2) return;

  const bounds = objects
    .map((obj) => ({ obj, bounds: getObjectBounds(obj) }))
    .filter((item) => item.bounds !== null) as {
    obj: fabric.FabricObject;
    bounds: NonNullable<ReturnType<typeof getObjectBounds>>;
  }[];

  if (bounds.length < 2) return;

  // Calculate reference position
  let reference: number;

  switch (alignment) {
    case 'left':
      reference = Math.min(...bounds.map((b) => b.bounds.left));
      bounds.forEach((item) => {
        const offsetX = (item.obj.left || 0) - item.bounds.centerX;
        const newCenterX = reference + item.bounds.width / 2;
        item.obj.set({ left: newCenterX + offsetX });
        item.obj.setCoords();
      });
      break;

    case 'center': {
      const avgCenterX =
        bounds.reduce((sum, b) => sum + b.bounds.centerX, 0) / bounds.length;
      reference = avgCenterX;
      bounds.forEach((item) => {
        const offsetX = (item.obj.left || 0) - item.bounds.centerX;
        item.obj.set({ left: reference + offsetX });
        item.obj.setCoords();
      });
      break;
    }

    case 'right':
      reference = Math.max(...bounds.map((b) => b.bounds.right));
      bounds.forEach((item) => {
        const offsetX = (item.obj.left || 0) - item.bounds.centerX;
        const newCenterX = reference - item.bounds.width / 2;
        item.obj.set({ left: newCenterX + offsetX });
        item.obj.setCoords();
      });
      break;

    case 'top':
      reference = Math.min(...bounds.map((b) => b.bounds.top));
      bounds.forEach((item) => {
        const offsetY = (item.obj.top || 0) - item.bounds.centerY;
        const newCenterY = reference + item.bounds.height / 2;
        item.obj.set({ top: newCenterY + offsetY });
        item.obj.setCoords();
      });
      break;

    case 'middle': {
      const avgCenterY =
        bounds.reduce((sum, b) => sum + b.bounds.centerY, 0) / bounds.length;
      reference = avgCenterY;
      bounds.forEach((item) => {
        const offsetY = (item.obj.top || 0) - item.bounds.centerY;
        item.obj.set({ top: reference + offsetY });
        item.obj.setCoords();
      });
      break;
    }

    case 'bottom':
      reference = Math.max(...bounds.map((b) => b.bounds.bottom));
      bounds.forEach((item) => {
        const offsetY = (item.obj.top || 0) - item.bounds.centerY;
        const newCenterY = reference - item.bounds.height / 2;
        item.obj.set({ top: newCenterY + offsetY });
        item.obj.setCoords();
      });
      break;
  }
}
