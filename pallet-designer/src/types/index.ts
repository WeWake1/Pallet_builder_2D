// Pallet Component Types
export type ComponentType = 
  | 'deck-board' 
  | 'stringer' 
  | 'block' 
  | 'notched-block' 
  | 'chamfered-block'
  | 'lead-board';

// Annotation types
export type AnnotationType = 'text' | 'dimension' | 'callout';

export type ViewType = 'top' | 'side' | 'end' | 'bottom';

export type PalletPreset = 'euro-epal' | 'cp1' | 'cp2' | 'cp3' | 'cp4' | 'cp5' | 'cp6' | 'cp7' | 'cp8' | 'cp9' | 'gma' | 'custom';

// Dimensions in millimeters
export interface Dimensions {
  width: number;
  thickness: number;
  length: number;
}

export interface Position {
  x: number;
  y: number;
}

// A single pallet component on the canvas
export interface PalletComponent {
  id: string;
  type: ComponentType;
  dimensions: Dimensions;
  position: Position;
  rotation: number; // degrees
  view: ViewType;
  label?: string;
  color?: {
    fill: string;
    stroke: string;
  };
}

// Text annotation on canvas
export interface TextAnnotation {
  id: string;
  type: 'text';
  text: string;
  position: Position;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  rotation: number;
  view: ViewType;
}

// Dimension line annotation
export interface DimensionAnnotation {
  id: string;
  type: 'dimension';
  startPosition: Position;
  endPosition: Position;
  value: number; // in mm
  showValue: boolean;
  view: ViewType;
}

// Callout annotation (text with leader line)
export interface CalloutAnnotation {
  id: string;
  type: 'callout';
  text: string;
  anchorPosition: Position; // point on the component
  textPosition: Position; // where the text bubble is
  view: ViewType;
}

// Union type for all annotations
export type Annotation = TextAnnotation | DimensionAnnotation | CalloutAnnotation;

// Helper type for distributive Omit (works with union types)
export type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

// Annotation without id (for creating new annotations)
export type NewAnnotation = DistributiveOmit<Annotation, 'id'>;

// Component definition for the palette/library
export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  icon: string;
  defaultDimensions: Dimensions;
  description: string;
}

// Pallet specification data
export interface PalletSpecification {
  palletId: string;
  classification: {
    type: 'block-class' | 'stringer-class';
    face: 'double-face' | 'single-face';
    reversible: 'reversible' | 'non-reversible';
    entry: '2-way' | '4-way';
    usage: 'single-use' | 'multiple-use';
  };
  overallDimensions: {
    length: number;
    width: number;
    height: number;
  };
  materials: {
    lumberId: string;
    surface: string;
    componentTolerance: {
      width: number;
      thickness: number;
    };
    palletTolerance: number;
    staticLoadCapacity: number;
    dynamicLoadCapacity: number;
  };
}

// Component summary for each view
export interface ViewComponentSummary {
  view: ViewType;
  viewLabel: string;
  components: {
    number: number;
    thickness: number;
    width: number;
    length: number;
  }[];
}

// Branding configuration
export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  watermarkText: string;
  primaryColor: string;
  secondaryColor: string;
}

// Editor mode - views tab shows individual views, final shows the complete template
export type EditorMode = 'views' | 'final';

// Canvas state
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  activeView: ViewType;
  editorMode: EditorMode;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number; // in mm
  darkMode: boolean;
}

// Main app state
export interface AppState {
  // Components on canvas (per view)
  components: Record<ViewType, PalletComponent[]>;
  
  // Annotations on canvas (per view)
  annotations: Record<ViewType, Annotation[]>;
  
  // Specification data
  specification: PalletSpecification;
  
  // Branding
  branding: BrandingConfig;
  
  // Canvas state
  canvas: CanvasState;
  
  // Selected component(s) - supports multi-selection
  selectedComponentIds: string[];
  
  // Selected annotation
  selectedAnnotationId: string | null;
  
  // Current preset
  currentPreset: PalletPreset;
  
  // Clipboard for copy/paste
  clipboard: PalletComponent | null;

  // Clipboard for annotation copy/duplicate
  annotationClipboard: Annotation | null;
  
  // History for undo/redo - stores both components and annotations
  history: {
    past: { components: Record<ViewType, PalletComponent[]>; annotations: Record<ViewType, Annotation[]> }[];
    future: { components: Record<ViewType, PalletComponent[]>; annotations: Record<ViewType, Annotation[]> }[];
  };
}

// Actions
export interface AppActions {
  // Component actions
  addComponent: (component: Omit<PalletComponent, 'id'>) => void;
  updateComponent: (id: string, updates: Partial<PalletComponent>) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  selectComponents: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  duplicateComponent: (id: string) => void;
  copyComponent: (id: string) => void;
  pasteComponent: () => void;
  
  // Annotation actions
  addAnnotation: (annotation: NewAnnotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;

  copyAnnotation: (id: string) => void;
  duplicateAnnotation: (id: string) => void;
  
  // View actions
  setActiveView: (view: ViewType) => void;
  setEditorMode: (mode: EditorMode) => void;
  
  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleDarkMode: () => void;
  setGridSize: (size: number) => void;
  
  // Specification actions
  updateSpecification: (updates: Partial<PalletSpecification>) => void;
  
  // Branding actions
  updateBranding: (updates: Partial<BrandingConfig>) => void;
  
  // Preset actions
  loadPreset: (preset: PalletPreset) => void;
  
  // Layer ordering actions (like Excalidraw)
  bringToFront: (id: string) => void;
  bringForward: (id: string) => void;
  sendToBack: (id: string) => void;
  sendBackward: (id: string) => void;
  
  // Annotation Layer ordering actions
  bringAnnotationToFront: (id: string) => void;
  bringAnnotationForward: (id: string) => void;
  sendAnnotationToBack: (id: string) => void;
  sendAnnotationBackward: (id: string) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  captureHistory: () => void; // Capture current state before a mutation
  
  // Reset
  resetCanvas: () => void;
}
