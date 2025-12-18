import { create } from 'zustand';
import type { 
  AppState, 
  AppActions, 
  PalletComponent, 
  ViewType, 
  PalletSpecification,
  BrandingConfig,
  Annotation
} from '../types';
import { DEFAULT_GRID_SIZE, DEFAULT_LOAD_CAPACITIES, DEFAULT_TOLERANCES } from '../constants';
import { getPresetComponents, getPresetDimensions } from '../data/presets';

// Generate unique ID
const generateId = () => `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initial specification
const initialSpecification: PalletSpecification = {
  palletId: '',
  classification: {
    type: 'block-class',
    face: 'double-face',
    reversible: 'non-reversible',
    entry: '4-way',
    usage: 'multiple-use',
  },
  overallDimensions: {
    length: 1200,
    width: 800,
    height: 144,
  },
  materials: {
    lumberId: 'Pine Wood',
    surface: 'S4S Planed',
    componentTolerance: {
      width: DEFAULT_TOLERANCES.componentWidth,
      thickness: DEFAULT_TOLERANCES.componentThickness,
    },
    palletTolerance: DEFAULT_TOLERANCES.pallet,
    staticLoadCapacity: DEFAULT_LOAD_CAPACITIES.static,
    dynamicLoadCapacity: DEFAULT_LOAD_CAPACITIES.dynamic,
  },
};

// Initial branding - Ambica Patterns India Pvt Ltd
const initialBranding: BrandingConfig = {
  companyName: 'Ambica Patterns India Pvt Ltd',
  logoUrl: '/logo.png',
  watermarkText: 'Ambica Patterns India Pvt Ltd',
  primaryColor: '#1e88e5', // Royal sky blue
  secondaryColor: '#0d47a1', // Darker blue
};

// Initial state
const initialState: Omit<AppState, keyof AppActions> = {
  components: {
    top: [],
    side: [],
    end: [],
    bottom: [],
  },
  annotations: {
    top: [],
    side: [],
    end: [],
    bottom: [],
  },
  specification: initialSpecification,
  branding: initialBranding,
  canvas: {
    zoom: 1,
    panX: 0,
    panY: 0,
    activeView: 'top',
    editorMode: 'views',
    gridEnabled: true,
    snapToGrid: true,
    gridSize: DEFAULT_GRID_SIZE,
    darkMode: false,
  },
  selectedComponentIds: [],
  selectedAnnotationId: null,
  currentPreset: 'custom',
  clipboard: null,
  history: {
    past: [],
    future: [],
  },
};

// Create store
export const useStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  // Helper to save current state to history before a mutation
  // This follows the Excalidraw pattern of capturing state before changes
  
  // Component actions
  addComponent: (componentData) => {
    const id = generateId();
    const component: PalletComponent = { ...componentData, id };
    const { canvas, components, annotations } = get();
    const view = canvas.activeView;
    
    // Save current state to history before mutation
    set((state) => ({
      components: {
        ...state.components,
        [view]: [...state.components[view], component],
      },
      history: {
        past: [...state.history.past, { components, annotations }],
        future: [], // Clear future on new action
      },
    }));
  },

  updateComponent: (id, updates) => {
    // Don't save history for every update (would create too many entries during drag)
    // History is saved on object:modified in fabric canvas
    set((state) => {
      const newComponents = { ...state.components };
      
      for (const view of Object.keys(newComponents) as ViewType[]) {
        const index = newComponents[view].findIndex((c) => c.id === id);
        if (index !== -1) {
          newComponents[view] = [
            ...newComponents[view].slice(0, index),
            { ...newComponents[view][index], ...updates },
            ...newComponents[view].slice(index + 1),
          ];
          break;
        }
      }
      
      return { components: newComponents };
    });
  },

  deleteComponent: (id) => {
    const { components, annotations } = get();
    set((state) => {
      const newComponents = { ...state.components };
      
      for (const view of Object.keys(newComponents) as ViewType[]) {
        newComponents[view] = newComponents[view].filter((c) => c.id !== id);
      }
      
      return {
        components: newComponents,
        selectedComponentIds: state.selectedComponentIds.filter((cid) => cid !== id),
        history: {
          past: [...state.history.past, { components, annotations }],
          future: [], // Clear future on new action
        },
      };
    });
  },

  selectComponent: (id) => {
    set({ selectedComponentIds: id ? [id] : [] });
  },

  selectComponents: (ids) => {
    set({ selectedComponentIds: ids });
  },

  addToSelection: (id) => {
    set((state) => ({
      selectedComponentIds: state.selectedComponentIds.includes(id) 
        ? state.selectedComponentIds 
        : [...state.selectedComponentIds, id],
    }));
  },

  removeFromSelection: (id) => {
    set((state) => ({
      selectedComponentIds: state.selectedComponentIds.filter((cid) => cid !== id),
    }));
  },

  duplicateComponent: (id) => {
    const { components } = get();
    
    for (const view of Object.keys(components) as ViewType[]) {
      const component = components[view].find((c) => c.id === id);
      if (component) {
        const newComponent: PalletComponent = {
          ...component,
          id: generateId(),
          position: {
            x: component.position.x + 20,
            y: component.position.y + 20,
          },
        };
        
        set((state) => ({
          components: {
            ...state.components,
            [view]: [...state.components[view], newComponent],
          },
          selectedComponentIds: [newComponent.id],
          history: {
            past: [...state.history.past, { components: state.components, annotations: state.annotations }],
            future: [],
          },
        }));
        break;
      }
    }
  },

  copyComponent: (id) => {
    const { components } = get();
    
    for (const view of Object.keys(components) as ViewType[]) {
      const component = components[view].find((c) => c.id === id);
      if (component) {
        set({ clipboard: { ...component } });
        break;
      }
    }
  },

  pasteComponent: () => {
    const { clipboard, canvas } = get();
    
    if (!clipboard) return;
    
    const newComponent: PalletComponent = {
      ...clipboard,
      id: generateId(),
      view: canvas.activeView,
      position: {
        x: clipboard.position.x + 20,
        y: clipboard.position.y + 20,
      },
    };
    
    set((state) => ({
      components: {
        ...state.components,
        [canvas.activeView]: [...state.components[canvas.activeView], newComponent],
      },
      selectedComponentIds: [newComponent.id],
      clipboard: { ...clipboard, position: newComponent.position }, // Update clipboard position for next paste
      history: {
        past: [...state.history.past, { components: state.components, annotations: state.annotations }],
        future: [],
      },
    }));
  },

  // Annotation actions
  addAnnotation: (annotationData) => {
    const id = generateId();
    const annotation = { ...annotationData, id };
    const { canvas, components, annotations } = get();
    const view = canvas.activeView;
    
    // Save current state to history before mutation
    set((state) => ({
      annotations: {
        ...state.annotations,
        [view]: [...state.annotations[view], annotation],
      },
      history: {
        past: [...state.history.past, { components, annotations }],
        future: [], // Clear future on new action
      },
    }));
  },

  updateAnnotation: (id, updates) => {
    // Don't save history for every update (would create too many entries during drag)
    set((state) => {
      const newAnnotations = { ...state.annotations };
      
      for (const view of Object.keys(newAnnotations) as ViewType[]) {
        const index = newAnnotations[view].findIndex((a) => a.id === id);
        if (index !== -1) {
          const existing = newAnnotations[view][index];
          newAnnotations[view] = [
            ...newAnnotations[view].slice(0, index),
            { ...existing, ...updates } as typeof existing,
            ...newAnnotations[view].slice(index + 1),
          ];
          break;
        }
      }
      
      return { annotations: newAnnotations };
    });
  },

  deleteAnnotation: (id) => {
    const { components, annotations } = get();
    set((state) => {
      const newAnnotations = { ...state.annotations };
      
      for (const view of Object.keys(newAnnotations) as ViewType[]) {
        newAnnotations[view] = newAnnotations[view].filter((a) => a.id !== id);
      }
      
      return {
        annotations: newAnnotations,
        selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        history: {
          past: [...state.history.past, { components, annotations }],
          future: [], // Clear future on new action
        },
      };
    });
  },

  selectAnnotation: (id) => {
    set({ selectedAnnotationId: id, selectedComponentIds: [] });
  },

  // View actions
  setActiveView: (view) => {
    set((state) => ({
      canvas: { ...state.canvas, activeView: view },
      selectedComponentIds: [],
      selectedAnnotationId: null,
    }));
  },

  setEditorMode: (mode) => {
    set((state) => ({
      canvas: { ...state.canvas, editorMode: mode },
      selectedComponentIds: [],
      selectedAnnotationId: null,
    }));
  },

  // Canvas actions
  setZoom: (zoom) => {
    set((state) => ({
      canvas: { ...state.canvas, zoom: Math.max(0.25, Math.min(4, zoom)) },
    }));
  },

  setPan: (x, y) => {
    set((state) => ({
      canvas: { ...state.canvas, panX: x, panY: y },
    }));
  },

  toggleGrid: () => {
    set((state) => {
      const newGridEnabled = !state.canvas.gridEnabled;
      // When grid is enabled, also enable snap. When disabled, disable snap too.
      return {
        canvas: { 
          ...state.canvas, 
          gridEnabled: newGridEnabled,
          snapToGrid: newGridEnabled,
        },
      };
    });
  },

  toggleSnap: () => {
    set((state) => ({
      canvas: { ...state.canvas, snapToGrid: !state.canvas.snapToGrid },
    }));
  },

  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.canvas.darkMode;
      // Apply dark class to document
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return {
        canvas: { ...state.canvas, darkMode: newDarkMode },
      };
    });
  },

  setGridSize: (size) => {
    set((state) => ({
      canvas: { ...state.canvas, gridSize: size },
    }));
  },

  // Specification actions
  updateSpecification: (updates) => {
    set((state) => ({
      specification: { ...state.specification, ...updates },
    }));
  },

  // Branding actions
  updateBranding: (updates) => {
    set((state) => ({
      branding: { ...state.branding, ...updates },
    }));
  },

  // Preset actions
  loadPreset: (preset) => {
    const presetComponents = getPresetComponents(preset);
    const presetDimensions = getPresetDimensions(preset);
    
    if (presetComponents) {
      // Convert preset components to full PalletComponents with IDs
      const newComponents: Record<ViewType, PalletComponent[]> = {
        top: [],
        side: [],
        end: [],
        bottom: [],
      };
      
      for (const view of Object.keys(presetComponents) as ViewType[]) {
        newComponents[view] = presetComponents[view].map((comp) => ({
          ...comp,
          id: generateId(),
          view,
        }));
      }
      
      set((state) => ({
        components: newComponents,
        annotations: {
          top: [],
          side: [],
          end: [],
          bottom: [],
        },
        currentPreset: preset,
        specification: {
          ...state.specification,
          overallDimensions: presetDimensions,
        },
        selectedComponentIds: [],
        selectedAnnotationId: null,
        history: {
          past: [...state.history.past, { components: state.components, annotations: state.annotations }],
          future: [],
        },
      }));
    } else {
      // Custom preset - just clear everything
      set((state) => ({
        components: {
          top: [],
          side: [],
          end: [],
          bottom: [],
        },
        annotations: {
          top: [],
          side: [],
          end: [],
          bottom: [],
        },
        currentPreset: preset,
        selectedComponentIds: [],
        selectedAnnotationId: null,
        history: {
          past: [...state.history.past, { components: state.components, annotations: state.annotations }],
          future: [],
        },
      }));
    }
  },

  // History actions
  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    set((state) => ({
      components: previous.components,
      annotations: previous.annotations,
      history: {
        past: newPast,
        future: [{ components: state.components, annotations: state.annotations }, ...state.history.future],
      },
    }));
  },

  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    set((state) => ({
      components: next.components,
      annotations: next.annotations,
      history: {
        past: [...state.history.past, { components: state.components, annotations: state.annotations }],
        future: newFuture,
      },
    }));
  },

  // Capture current state to history - call this before a mutation
  // This allows canvas operations to save history before modifying state
  captureHistory: () => {
    const { components, annotations } = get();
    set((state) => ({
      history: {
        past: [...state.history.past, { components, annotations }],
        future: [], // Clear future on new action
      },
    }));
  },

  // Layer ordering actions (inspired by Excalidraw)
  bringToFront: (id) => {
    const { components, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const index = viewComponents.findIndex((c) => c.id === id);
    
    if (index === -1 || index === viewComponents.length - 1) return;
    
    const component = viewComponents[index];
    const newComponents = [
      ...viewComponents.slice(0, index),
      ...viewComponents.slice(index + 1),
      component,
    ];
    
    set({
      components: { ...components, [view]: newComponents },
    });
  },

  bringForward: (id) => {
    const { components, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const index = viewComponents.findIndex((c) => c.id === id);
    
    if (index === -1 || index === viewComponents.length - 1) return;
    
    const newComponents = [...viewComponents];
    // Swap with next element
    [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
    
    set({
      components: { ...components, [view]: newComponents },
    });
  },

  sendToBack: (id) => {
    const { components, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const index = viewComponents.findIndex((c) => c.id === id);
    
    if (index <= 0) return;
    
    const component = viewComponents[index];
    const newComponents = [
      component,
      ...viewComponents.slice(0, index),
      ...viewComponents.slice(index + 1),
    ];
    
    set({
      components: { ...components, [view]: newComponents },
    });
  },

  sendBackward: (id) => {
    const { components, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const index = viewComponents.findIndex((c) => c.id === id);
    
    if (index <= 0) return;
    
    const newComponents = [...viewComponents];
    // Swap with previous element
    [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
    
    set({
      components: { ...components, [view]: newComponents },
    });
  },

  // Annotation Layer ordering actions
  bringAnnotationToFront: (id) => {
    const { annotations, canvas } = get();
    const view = canvas.activeView;
    const viewAnnotations = annotations[view];
    const index = viewAnnotations.findIndex((a) => a.id === id);
    
    if (index === -1 || index === viewAnnotations.length - 1) return;
    
    const annotation = viewAnnotations[index];
    const newAnnotations = [
      ...viewAnnotations.slice(0, index),
      ...viewAnnotations.slice(index + 1),
      annotation,
    ];
    
    set({
      annotations: { ...annotations, [view]: newAnnotations },
    });
  },

  bringAnnotationForward: (id) => {
    const { annotations, canvas } = get();
    const view = canvas.activeView;
    const viewAnnotations = annotations[view];
    const index = viewAnnotations.findIndex((a) => a.id === id);
    
    if (index === -1 || index === viewAnnotations.length - 1) return;
    
    const newAnnotations = [...viewAnnotations];
    // Swap with next element
    [newAnnotations[index], newAnnotations[index + 1]] = [newAnnotations[index + 1], newAnnotations[index]];
    
    set({
      annotations: { ...annotations, [view]: newAnnotations },
    });
  },

  sendAnnotationToBack: (id) => {
    const { annotations, canvas } = get();
    const view = canvas.activeView;
    const viewAnnotations = annotations[view];
    const index = viewAnnotations.findIndex((a) => a.id === id);
    
    if (index <= 0) return;
    
    const annotation = viewAnnotations[index];
    const newAnnotations = [
      annotation,
      ...viewAnnotations.slice(0, index),
      ...viewAnnotations.slice(index + 1),
    ];
    
    set({
      annotations: { ...annotations, [view]: newAnnotations },
    });
  },

  sendAnnotationBackward: (id) => {
    const { annotations, canvas } = get();
    const view = canvas.activeView;
    const viewAnnotations = annotations[view];
    const index = viewAnnotations.findIndex((a) => a.id === id);
    
    if (index <= 0) return;
    
    const newAnnotations = [...viewAnnotations];
    // Swap with previous element
    [newAnnotations[index - 1], newAnnotations[index]] = [newAnnotations[index], newAnnotations[index - 1]];
    
    set({
      annotations: { ...annotations, [view]: newAnnotations },
    });
  },

  // Reset
  resetCanvas: () => {
    set({
      ...initialState,
      branding: get().branding, // Keep branding
    });
  },
}));

// Selectors
export const useActiveViewComponents = () => {
  return useStore((state) => state.components[state.canvas.activeView]);
};

export const useActiveViewAnnotations = () => {
  return useStore((state) => state.annotations[state.canvas.activeView]);
};

export const useSelectedComponent = () => {
  return useStore((state) => {
    // Return the first selected component (for backward compatibility with single selection UI)
    if (state.selectedComponentIds.length === 0) return null;
    const selectedId = state.selectedComponentIds[0];
    
    for (const view of Object.keys(state.components) as ViewType[]) {
      const component = state.components[view].find((c) => c.id === selectedId);
      if (component) return component;
    }
    return null;
  });
};

export const useSelectedComponents = () => {
  return useStore((state) => {
    const components: PalletComponent[] = [];
    for (const id of state.selectedComponentIds) {
      for (const view of Object.keys(state.components) as ViewType[]) {
        const component = state.components[view].find((c) => c.id === id);
        if (component) {
          components.push(component);
          break;
        }
      }
    }
    return components;
  });
};

export const useSelectedAnnotation = (): Annotation | null => {
  return useStore((state) => {
    if (!state.selectedAnnotationId) return null;
    
    for (const view of Object.keys(state.annotations) as ViewType[]) {
      const annotation = state.annotations[view].find((a) => a.id === state.selectedAnnotationId);
      if (annotation) return annotation;
    }
    return null;
  });
};

export const useCanUndo = () => {
  return useStore((state) => state.history.past.length > 0);
};

export const useCanRedo = () => {
  return useStore((state) => state.history.future.length > 0);
};
