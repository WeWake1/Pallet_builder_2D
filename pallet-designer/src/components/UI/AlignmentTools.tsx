import { 
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import * as fabric from 'fabric';
import { alignObjects, distributeObjects } from '../../utils/alignmentGuides';

interface AlignmentToolsProps {
  fabricCanvas: fabric.Canvas | null;
}

export function AlignmentTools({ fabricCanvas }: AlignmentToolsProps) {
  const { selectedComponentIds, selectedAnnotationId } = useStore();
  
  // Only show tools when multiple objects are selected
  const isMultiSelection = selectedComponentIds.length >= 2 || 
    (selectedComponentIds.length >= 1 && selectedAnnotationId !== null);
  
  if (!isMultiSelection || !fabricCanvas) return null;

  // Get selected fabric objects
  const getSelectedObjects = (): fabric.FabricObject[] => {
    const activeSelection = fabricCanvas.getActiveObject();
    if (activeSelection && activeSelection.type === 'activeSelection') {
      return (activeSelection as fabric.ActiveSelection).getObjects();
    }
    // Single object selected
    if (activeSelection) {
      return [activeSelection];
    }
    return [];
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const objects = getSelectedObjects();
    if (objects.length < 2) return;

    // Capture history before alignment
    useStore.getState().captureHistory();

    alignObjects(objects, alignment);
    fabricCanvas.requestRenderAll();

    // Trigger sync to update store
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      fabricCanvas.fire('object:modified', { target: activeObj });
    }
  };

  const handleDistribute = (axis: 'horizontal' | 'vertical') => {
    const objects = getSelectedObjects();
    if (objects.length < 3) return;

    // Capture history before distribution
    useStore.getState().captureHistory();

    distributeObjects(objects, axis);
    fabricCanvas.requestRenderAll();

    // Trigger sync to update store
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      fabricCanvas.fire('object:modified', { target: activeObj });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg">
      <div className="space-y-3">
        {/* Horizontal Alignment */}
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 px-1">
            Align
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleAlign('left')}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Align Left"
            >
              <AlignStartHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => handleAlign('center')}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Align Center"
            >
              <AlignCenterHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Align Right"
            >
              <AlignEndHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={() => handleAlign('top')}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Align Top"
            >
              <AlignStartVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => handleAlign('middle')}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Align Middle"
            >
              <AlignCenterVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Align Bottom"
            >
              <AlignEndVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Distribution - only show if 3+ objects */}
        {getSelectedObjects().length >= 3 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 px-1">
              Distribute
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleDistribute('horizontal')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Distribute Horizontally"
              >
                <AlignHorizontalSpaceBetween className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => handleDistribute('vertical')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Distribute Vertically"
              >
                <AlignVerticalSpaceBetween className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
