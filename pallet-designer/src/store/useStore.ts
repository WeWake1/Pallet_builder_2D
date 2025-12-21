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
  annotationClipboard: null,
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
    const { canvas, components, annotations } = get();
    const view = canvas.activeView;
    
    // Calculate max zIndex
    let maxZ = 0;
    components[view].forEach(c => maxZ = Math.max(maxZ, c.zIndex || 0));
    annotations[view].forEach(a => maxZ = Math.max(maxZ, a.zIndex || 0));

    const component: PalletComponent = { ...componentData, id, zIndex: maxZ + 1 };
    
    // Save current state to history before mutation
    set((state) => ({
      components: {
        ...state.components,
        [view]: [...state.components[view], component],
      },
      selectedComponentIds: [id],
      selectedAnnotationId: null,
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
    set({ selectedComponentIds: id ? [id] : [], selectedAnnotationId: null });
  },

  selectComponents: (ids) => {
    set({ selectedComponentIds: ids, selectedAnnotationId: null });
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

  copyAnnotation: (id: string) => {
    const { annotations } = get();
    for (const view of Object.keys(annotations) as ViewType[]) {
      const ann = annotations[view].find((a) => a.id === id);
      if (ann) {
        set({ annotationClipboard: { ...ann } });
        break;
      }
    }
  },

  duplicateAnnotation: (id: string) => {
    const { annotations, canvas } = get();
    const view = canvas.activeView;
    const viewAnnotations = annotations[view];
    const ann = viewAnnotations.find((a) => a.id === id);
    if (!ann) return;

    const newId = generateId();

    let duplicated: Annotation;
    if (ann.type === 'text') {
      duplicated = {
        ...ann,
        id: newId,
        position: { x: ann.position.x + 20, y: ann.position.y + 20 },
      };
    } else if (ann.type === 'dimension') {
      duplicated = {
        ...ann,
        id: newId,
        startPosition: { x: ann.startPosition.x + 20, y: ann.startPosition.y + 20 },
        endPosition: { x: ann.endPosition.x + 20, y: ann.endPosition.y + 20 },
      };
    } else {
      duplicated = {
        ...ann,
        id: newId,
        anchorPosition: { x: ann.anchorPosition.x + 20, y: ann.anchorPosition.y + 20 },
        textPosition: { x: ann.textPosition.x + 20, y: ann.textPosition.y + 20 },
      };
    }

    set((state) => ({
      annotations: {
        ...state.annotations,
        [view]: [...state.annotations[view], duplicated],
      },
      selectedAnnotationId: newId,
      history: {
        past: [...state.history.past, { components: state.components, annotations: state.annotations }],
        future: [],
      },
    }));
  },

  // Annotation actions
  addAnnotation: (annotationData) => {
    const id = generateId();
    const { canvas, components, annotations } = get();
    const view = canvas.activeView;

    // Calculate max zIndex
    let maxZ = 0;
    components[view].forEach(c => maxZ = Math.max(maxZ, c.zIndex || 0));
    annotations[view].forEach(a => maxZ = Math.max(maxZ, a.zIndex || 0));

    const annotation = { ...annotationData, id, zIndex: maxZ + 1 };
    
    // Save current state to history before mutation
    set((state) => ({
      annotations: {
        ...state.annotations,
        [view]: [...state.annotations[view], annotation],
      },
      selectedAnnotationId: id,
      selectedComponentIds: [],
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
  // Layer ordering actions (unified)
  bringToFront: (id) => {
    const { components, annotations, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const viewAnnotations = annotations[view];
    
    // Find max zIndex
    let maxZ = 0;
    viewComponents.forEach(c => maxZ = Math.max(maxZ, c.zIndex || 0));
    viewAnnotations.forEach(a => maxZ = Math.max(maxZ, a.zIndex || 0));
    
    // Check if it's a component
    const compIndex = viewComponents.findIndex(c => c.id === id);
    if (compIndex !== -1) {
        const newComponents = [...viewComponents];
        newComponents[compIndex] = { ...newComponents[compIndex], zIndex: maxZ + 1 };
        set({ components: { ...components, [view]: newComponents } });
        return;
    }
    
    // Check if it's an annotation
    const annIndex = viewAnnotations.findIndex(a => a.id === id);
    if (annIndex !== -1) {
        const newAnnotations = [...viewAnnotations];
        newAnnotations[annIndex] = { ...newAnnotations[annIndex], zIndex: maxZ + 1 };
        set({ annotations: { ...annotations, [view]: newAnnotations } });
        return;
    }
  },

  bringForward: (id) => {
    const { components, annotations, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const viewAnnotations = annotations[view];
    
    // Collect all objects with zIndex
    const allObjects = [
      ...viewComponents.map(c => ({ id: c.id, zIndex: c.zIndex || 0, type: 'component' })),
      ...viewAnnotations.map(a => ({ id: a.id, zIndex: a.zIndex || 0, type: 'annotation' }))
    ].sort((a, b) => a.zIndex - b.zIndex);
    
    const currentIndex = allObjects.findIndex(o => o.id === id);
    if (currentIndex === -1 || currentIndex === allObjects.length - 1) return;
    
    const currentObj = allObjects[currentIndex];
    const nextObj = allObjects[currentIndex + 1];
    
    // Swap zIndices
    // If they have the same zIndex, increment current to be above
    const newZ = currentObj.zIndex === nextObj.zIndex ? currentObj.zIndex + 1 : nextObj.zIndex;
    const nextNewZ = currentObj.zIndex; // Swap
    
    // Update current object
    if (currentObj.type === 'component') {
      const idx = viewComponents.findIndex(c => c.id === id);
      const newComponents = [...viewComponents];
      newComponents[idx] = { ...newComponents[idx], zIndex: newZ };
      set({ components: { ...components, [view]: newComponents } });
    } else {
      const idx = viewAnnotations.findIndex(a => a.id === id);
      const newAnnotations = [...viewAnnotations];
      newAnnotations[idx] = { ...newAnnotations[idx], zIndex: newZ };
      set({ annotations: { ...annotations, [view]: newAnnotations } });
    }
    
    // Update next object (swap)
    // We need to fetch fresh state because we might have just updated it
    const freshState = get();
    if (nextObj.type === 'component') {
      const idx = freshState.components[view].findIndex(c => c.id === nextObj.id);
      const newComponents = [...freshState.components[view]];
      newComponents[idx] = { ...newComponents[idx], zIndex: nextNewZ };
      set({ components: { ...freshState.components, [view]: newComponents } });
    } else {
      const idx = freshState.annotations[view].findIndex(a => a.id === nextObj.id);
      const newAnnotations = [...freshState.annotations[view]];
      newAnnotations[idx] = { ...newAnnotations[idx], zIndex: nextNewZ };
      set({ annotations: { ...freshState.annotations, [view]: newAnnotations } });
    }
  },

  sendToBack: (id) => {
    const { components, annotations, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const viewAnnotations = annotations[view];
    
    // Find min zIndex
    let minZ = 0;
    viewComponents.forEach(c => minZ = Math.min(minZ, c.zIndex || 0));
    viewAnnotations.forEach(a => minZ = Math.min(minZ, a.zIndex || 0));
    
    // Check if it's a component
    const compIndex = viewComponents.findIndex(c => c.id === id);
    if (compIndex !== -1) {
        const newComponents = [...viewComponents];
        newComponents[compIndex] = { ...newComponents[compIndex], zIndex: minZ - 1 };
        set({ components: { ...components, [view]: newComponents } });
        return;
    }
    
    // Check if it's an annotation
    const annIndex = viewAnnotations.findIndex(a => a.id === id);
    if (annIndex !== -1) {
        const newAnnotations = [...viewAnnotations];
        newAnnotations[annIndex] = { ...newAnnotations[annIndex], zIndex: minZ - 1 };
        set({ annotations: { ...annotations, [view]: newAnnotations } });
        return;
    }
  },

  sendBackward: (id) => {
    const { components, annotations, canvas } = get();
    const view = canvas.activeView;
    const viewComponents = components[view];
    const viewAnnotations = annotations[view];
    
    // Collect all objects with zIndex
    const allObjects = [
      ...viewComponents.map(c => ({ id: c.id, zIndex: c.zIndex || 0, type: 'component' })),
      ...viewAnnotations.map(a => ({ id: a.id, zIndex: a.zIndex || 0, type: 'annotation' }))
    ].sort((a, b) => a.zIndex - b.zIndex);
    
    const currentIndex = allObjects.findIndex(o => o.id === id);
    if (currentIndex <= 0) return;
    
    const currentObj = allObjects[currentIndex];
    const prevObj = allObjects[currentIndex - 1];
    
    // Swap zIndices
    const newZ = prevObj.zIndex;
    const prevNewZ = currentObj.zIndex === prevObj.zIndex ? currentObj.zIndex + 1 : currentObj.zIndex;
    
    // Update current object
    if (currentObj.type === 'component') {
      const idx = viewComponents.findIndex(c => c.id === id);
      const newComponents = [...viewComponents];
      newComponents[idx] = { ...newComponents[idx], zIndex: newZ };
      set({ components: { ...components, [view]: newComponents } });
    } else {
      const idx = viewAnnotations.findIndex(a => a.id === id);
      const newAnnotations = [...viewAnnotations];
      newAnnotations[idx] = { ...newAnnotations[idx], zIndex: newZ };
      set({ annotations: { ...annotations, [view]: newAnnotations } });
    }
    
    // Update prev object (swap)
    const freshState = get();
    if (prevObj.type === 'component') {
      const idx = freshState.components[view].findIndex(c => c.id === prevObj.id);
      const newComponents = [...freshState.components[view]];
      newComponents[idx] = { ...newComponents[idx], zIndex: prevNewZ };
      set({ components: { ...freshState.components, [view]: newComponents } });
    } else {
      const idx = freshState.annotations[view].findIndex(a => a.id === prevObj.id);
      const newAnnotations = [...freshState.annotations[view]];
      newAnnotations[idx] = { ...newAnnotations[idx], zIndex: prevNewZ };
      set({ annotations: { ...freshState.annotations, [view]: newAnnotations } });
    }
  },

  // Annotation Layer ordering actions - mapped to unified actions
  bringAnnotationToFront: (id) => get().bringToFront(id),
  bringAnnotationForward: (id) => get().bringForward(id),
  sendAnnotationToBack: (id) => get().sendToBack(id),
  sendAnnotationBackward: (id) => get().sendBackward(id),

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
