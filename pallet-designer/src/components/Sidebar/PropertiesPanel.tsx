import { useStore, useSelectedComponent } from '../../store/useStore';
import { COMPONENT_COLORS } from '../../constants';

// Preset color options
const COLOR_PRESETS = [
  { name: 'Natural Wood', fill: '#d4a574', stroke: '#8b6914' },
  { name: 'Light Pine', fill: '#e5c49a', stroke: '#8b6914' },
  { name: 'Dark Oak', fill: '#a67c52', stroke: '#5c4033' },
  { name: 'Walnut', fill: '#6b4423', stroke: '#3d2314' },
  { name: 'Cherry', fill: '#8b4513', stroke: '#5c2d0e' },
  { name: 'White', fill: '#f5f5f5', stroke: '#cccccc' },
  { name: 'Gray', fill: '#9ca3af', stroke: '#6b7280' },
  { name: 'Blue', fill: '#3b82f6', stroke: '#1d4ed8' },
  { name: 'Green', fill: '#22c55e', stroke: '#16a34a' },
  { name: 'Red', fill: '#ef4444', stroke: '#dc2626' },
];

export function PropertiesPanel() {
  const { updateComponent, deleteComponent, duplicateComponent, bringToFront, bringForward, sendToBack, sendBackward } = useStore();
  const selectedComponent = useSelectedComponent();

  if (!selectedComponent) {
    return (
      <div className="p-4 text-center text-[var(--color-text-muted)]">
        <p className="text-sm">Select a component to edit its properties</p>
      </div>
    );
  }

  // Use custom color if set, otherwise use default for component type
  const colors = selectedComponent.color || COMPONENT_COLORS[selectedComponent.type];

  const handleDimensionChange = (key: 'width' | 'thickness' | 'length', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      updateComponent(selectedComponent.id, {
        dimensions: {
          ...selectedComponent.dimensions,
          [key]: numValue,
        },
      });
    }
  };

  const handlePositionChange = (key: 'x' | 'y', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      updateComponent(selectedComponent.id, {
        position: {
          ...selectedComponent.position,
          [key]: numValue,
        },
      });
    }
  };

  const handleRotationChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      updateComponent(selectedComponent.id, {
        rotation: numValue % 360,
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Component Type Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center border-2"
          style={{
            backgroundColor: colors.fill,
            borderColor: colors.stroke,
          }}
        />
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] capitalize">
            {selectedComponent.type.replace('-', ' ')}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            ID: {selectedComponent.id.slice(-8)}
          </p>
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Dimensions (mm)
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Width</label>
            <input
              type="number"
              value={selectedComponent.dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full h-8 px-2 rounded border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Thick</label>
            <input
              type="number"
              value={selectedComponent.dimensions.thickness}
              onChange={(e) => handleDimensionChange('thickness', e.target.value)}
              className="w-full h-8 px-2 rounded border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Length</label>
            <input
              type="number"
              value={selectedComponent.dimensions.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              className="w-full h-8 px-2 rounded border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Position (mm)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">X</label>
            <input
              type="number"
              value={selectedComponent.position.x}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="w-full h-8 px-2 rounded border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Y</label>
            <input
              type="number"
              value={selectedComponent.position.y}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className="w-full h-8 px-2 rounded border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Rotation
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="360"
            value={selectedComponent.rotation}
            onChange={(e) => handleRotationChange(e.target.value)}
            className="flex-1 h-2 rounded-lg appearance-none bg-gray-200"
          />
          <input
            type="number"
            value={selectedComponent.rotation}
            onChange={(e) => handleRotationChange(e.target.value)}
            className="w-16 h-8 px-2 rounded border border-[var(--color-border)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <span className="text-xs text-[var(--color-text-muted)]">°</span>
        </div>
      </div>

      {/* Color */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Color
        </h4>
        {/* Color Presets */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateComponent(selectedComponent.id, { color: { fill: preset.fill, stroke: preset.stroke } })}
              className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                colors.fill === preset.fill && colors.stroke === preset.stroke
                  ? 'ring-2 ring-[var(--color-primary)] ring-offset-1'
                  : ''
              }`}
              style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
              title={preset.name}
            />
          ))}
        </div>
        {/* Custom Color Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Fill</label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={colors.fill}
                onChange={(e) => updateComponent(selectedComponent.id, { color: { ...colors, fill: e.target.value } })}
                className="w-8 h-8 rounded border border-[var(--color-border)] cursor-pointer"
              />
              <input
                type="text"
                value={colors.fill}
                onChange={(e) => updateComponent(selectedComponent.id, { color: { ...colors, fill: e.target.value } })}
                className="flex-1 h-8 px-2 rounded border border-[var(--color-border)] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Stroke</label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={colors.stroke}
                onChange={(e) => updateComponent(selectedComponent.id, { color: { ...colors, stroke: e.target.value } })}
                className="w-8 h-8 rounded border border-[var(--color-border)] cursor-pointer"
              />
              <input
                type="text"
                value={colors.stroke}
                onChange={(e) => updateComponent(selectedComponent.id, { color: { ...colors, stroke: e.target.value } })}
                className="flex-1 h-8 px-2 rounded border border-[var(--color-border)] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>
        {/* Reset to Default */}
        <button
          onClick={() => updateComponent(selectedComponent.id, { color: undefined })}
          className="mt-2 w-full h-7 rounded border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:bg-gray-50 transition-colors"
        >
          Reset to Default Color
        </button>
      </div>

      {/* Layer Ordering */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Layer Order
        </h4>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => sendToBack(selectedComponent.id)}
            className="h-8 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Send to Back (Ctrl+Shift+[)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          <button
            onClick={() => sendBackward(selectedComponent.id)}
            className="h-8 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Send Backward (Ctrl+[)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => bringForward(selectedComponent.id)}
            className="h-8 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Bring Forward (Ctrl+])"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => bringToFront(selectedComponent.id)}
            className="h-8 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Bring to Front (Ctrl+Shift+])"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1 px-1">
          <span>Back</span>
          <span>Front</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex gap-2">
        <button
          onClick={() => duplicateComponent(selectedComponent.id)}
          className="flex-1 h-9 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicate
        </button>
        <button
          onClick={() => deleteComponent(selectedComponent.id)}
          className="flex-1 h-9 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
