import { useState, useCallback } from 'react';
import { useStore, useSelectedComponent } from '../../store/useStore';
import { COMPONENT_DEFINITIONS, COMPONENT_COLORS } from '../../constants';
import { PropertiesPanel } from './PropertiesPanel';
import type { ComponentType, AnnotationType } from '../../types';

type TabType = 'components' | 'properties' | 'annotations';

// Annotation tool definitions
const ANNOTATION_TOOLS: { type: AnnotationType; name: string; icon: string; description: string }[] = [
  { type: 'text', name: 'Text Label', icon: 'T', description: 'Add text annotation' },
  { type: 'dimension', name: 'Dimension Line', icon: '↔', description: 'Show measurements' },
  { type: 'callout', name: 'Callout', icon: '💬', description: 'Label with leader line' },
];

export function Sidebar() {
  const { canvas, addComponent, addAnnotation, selectComponent, toggleGrid } = useStore();
  const { activeView, gridEnabled } = canvas;
  const selectedComponent = useSelectedComponent();
  const [activeTab, setActiveTab] = useState<TabType>('components');
  const [draggedComponent, setDraggedComponent] = useState<ComponentType | null>(null);

  // Handle tab change - deselect component when switching away from properties
  const handleTabChange = (tab: TabType) => {
    if (tab !== 'properties') {
      selectComponent(null); // Deselect component when switching to other tabs
    }
    setActiveTab(tab);
  };

  // If component selected and we're not explicitly on another tab, show properties
  const effectiveTab = activeTab;

  const handleAddComponent = (type: ComponentType) => {
    const definition = COMPONENT_DEFINITIONS.find((d) => d.type === type);
    if (!definition) return;

    // Add at center-ish position
    addComponent({
      type,
      dimensions: { ...definition.defaultDimensions },
      position: { x: 50, y: 50 },
      rotation: 0,
      view: activeView,
    });
  };

  const handleAddAnnotation = (type: AnnotationType) => {
    if (type === 'text') {
      addAnnotation({
        type: 'text',
        text: 'Label',
        position: { x: 100, y: 100 },
        fontSize: 12,
        fontWeight: 'normal',
        color: '#333333',
        rotation: 0,
        view: activeView,
      });
    } else if (type === 'dimension') {
      addAnnotation({
        type: 'dimension',
        startPosition: { x: 50, y: 150 },
        endPosition: { x: 150, y: 150 },
        value: 100,
        showValue: true,
        view: activeView,
      });
    } else if (type === 'callout') {
      addAnnotation({
        type: 'callout',
        text: 'Note',
        anchorPosition: { x: 100, y: 100 },
        textPosition: { x: 130, y: 80 },
        view: activeView,
      });
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedComponent(type);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedComponent(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => handleTabChange('components')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            effectiveTab === 'components'
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => handleTabChange('properties')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            effectiveTab === 'properties'
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Properties
          {selectedComponent && (
            <span className="ml-1 w-2 h-2 bg-[var(--color-primary)] rounded-full inline-block" />
          )}
        </button>
        <button
          onClick={() => handleTabChange('annotations')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            effectiveTab === 'annotations'
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Labels
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {effectiveTab === 'components' && (
          <div className="p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Click to add or drag onto canvas
            </p>
            <div className="space-y-2">
              {COMPONENT_DEFINITIONS.map((component) => (
                <button
                  key={component.type}
                  onClick={() => handleAddComponent(component.type)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component.type)}
                  onDragEnd={handleDragEnd}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left group cursor-grab active:cursor-grabbing ${
                    draggedComponent === component.type
                      ? 'border-[var(--color-primary)] bg-blue-100 dark:bg-blue-900/30 opacity-50'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 shrink-0"
                    style={{
                      backgroundColor: COMPONENT_COLORS[component.type].fill,
                      borderColor: COMPONENT_COLORS[component.type].stroke,
                    }}
                  >
                    {component.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text)] truncate">
                      {component.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">
                      {component.description}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {effectiveTab === 'annotations' && (
          <div className="p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Add labels and measurements
            </p>
            <div className="space-y-2">
              {ANNOTATION_TOOLS.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => handleAddAnnotation(tool.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text)] truncate">
                      {tool.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">
                      {tool.description}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {effectiveTab === 'properties' && <PropertiesPanel />}
      </div>



      {/* Canvas Settings */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Settings
        </h3>
        <div className="space-y-3">
          {/* Grid Toggle (also enables snap) */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm text-[var(--color-text)]">Show Grid</span>
              <p className="text-xs text-[var(--color-text-muted)]">Also enables snap</p>
            </div>
            <button
              onClick={toggleGrid}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                gridEnabled ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  gridEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}

