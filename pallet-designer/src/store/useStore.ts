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
    gridEnabled: true,
    snapToGrid: true,
    gridSize: DEFAULT_GRID_SIZE,
  },
  selectedComponentId: null,
  selectedAnnotationId: null,
  currentPreset: 'custom',
  history: {
    past: [],
    future: [],
  },
};

// Create store
export const useStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  // Component actions
  addComponent: (componentData) => {
    const id = generateId();
    const component: PalletComponent = { ...componentData, id };
    const { canvas, components, annotations } = get();
    const view = canvas.activeView;
    
    // Save current state to history (both components and annotations)
    set((state) => ({
      components: {
        ...state.components,
        [view]: [...state.components[view], component],
      },
      history: {
        past: [...state.history.past, { components, annotations }],
        future: [],
      },
    }));
  },

  updateComponent: (id, updates) => {
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
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
        history: {
          past: [...state.history.past, { components, annotations }],
          future: [],
        },
      };
    });
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id });
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
          selectedComponentId: newComponent.id,
          history: {
            past: [...state.history.past, { components: state.components, annotations: state.annotations }],
            future: [],
          },
        }));
        break;
      }
    }
  },

  // Annotation actions
  addAnnotation: (annotationData) => {
    const id = generateId();
    const annotation = { ...annotationData, id };
    const { canvas } = get();
    const view = canvas.activeView;
    
    set((state) => ({
      annotations: {
        ...state.annotations,
        [view]: [...state.annotations[view], annotation],
      },
    }));
  },

  updateAnnotation: (id, updates) => {
    set((state) => {
      const newAnnotations = { ...state.annotations };
      
      for (const view of Object.keys(newAnnotations) as ViewType[]) {
        const index = newAnnotations[view].findIndex((a) => a.id === id);
        if (index !== -1) {
          const existing = newAnnotations[view][index];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    set((state) => {
      const newAnnotations = { ...state.annotations };
      
      for (const view of Object.keys(newAnnotations) as ViewType[]) {
        newAnnotations[view] = newAnnotations[view].filter((a) => a.id !== id);
      }
      
      return {
        annotations: newAnnotations,
        selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
      };
    });
  },

  selectAnnotation: (id) => {
    set({ selectedAnnotationId: id, selectedComponentId: null });
  },

  // View actions
  setActiveView: (view) => {
    set((state) => ({
      canvas: { ...state.canvas, activeView: view },
      selectedComponentId: null,
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
    set((state) => ({
      canvas: { ...state.canvas, gridEnabled: !state.canvas.gridEnabled },
    }));
  },

  toggleSnap: () => {
    set((state) => ({
      canvas: { ...state.canvas, snapToGrid: !state.canvas.snapToGrid },
    }));
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
        selectedComponentId: null,
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
        selectedComponentId: null,
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
    if (!state.selectedComponentId) return null;
    
    for (const view of Object.keys(state.components) as ViewType[]) {
      const component = state.components[view].find((c) => c.id === state.selectedComponentId);
      if (component) return component;
    }
    return null;
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
