import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { COMPONENT_DEFINITIONS, VIEW_LABELS, COMPONENT_COLORS } from '../../constants';
import type { ComponentType, ViewType } from '../../types';

export function MobileToolbar() {
  const [showComponents, setShowComponents] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const { canvas, setActiveView, addComponent } = useStore();
  const { activeView } = canvas;

  const handleAddComponent = (type: ComponentType) => {
    const definition = COMPONENT_DEFINITIONS.find((d) => d.type === type);
    if (!definition) return;

    addComponent({
      type,
      dimensions: { ...definition.defaultDimensions },
      position: { x: 50, y: 50 },
      rotation: 0,
      view: activeView,
    });
    setShowComponents(false);
  };

  return (
    <>
      {/* Component Picker Overlay */}
      {showComponents && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowComponents(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 bg-[var(--color-surface)] rounded-t-2xl max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Add Component</h3>
              <div className="grid grid-cols-2 gap-2">
                {COMPONENT_DEFINITIONS.map((component) => (
                  <button
                    key={component.type}
                    onClick={() => handleAddComponent(component.type)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] active:bg-blue-50 text-left"
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-sm border"
                      style={{
                        backgroundColor: COMPONENT_COLORS[component.type].fill,
                        borderColor: COMPONENT_COLORS[component.type].stroke,
                      }}
                    >
                      {component.icon}
                    </div>
                    <span className="text-sm text-[var(--color-text)] truncate">
                      {component.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Picker Overlay */}
      {showViews && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowViews(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 bg-[var(--color-surface)] rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Select View</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VIEW_LABELS) as ViewType[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => {
                      setActiveView(view);
                      setShowViews(false);
                    }}
                    className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                      activeView === view
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-gray-100 text-[var(--color-text)] active:bg-gray-200'
                    }`}
                  >
                    {VIEW_LABELS[view].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 shrink-0 safe-area-pb">
        {/* View Selector */}
        <button
          onClick={() => setShowViews(true)}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-lg active:bg-gray-100"
        >
          <svg className="w-6 h-6 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Views</span>
        </button>

        {/* Add Component */}
        <button
          onClick={() => setShowComponents(true)}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary)] text-white -mt-4 shadow-lg"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Text Tool */}
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-lg active:bg-gray-100"
        >
          <svg className="w-6 h-6 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Text</span>
        </button>

        {/* More Options */}
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-lg active:bg-gray-100"
        >
          <svg className="w-6 h-6 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">More</span>
        </button>
      </div>
    </>
  );
}
