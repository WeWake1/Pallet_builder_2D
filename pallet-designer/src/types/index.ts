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

// Canvas state
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  activeView: ViewType;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number; // in mm
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
  
  // Selected component
  selectedComponentId: string | null;
  
  // Selected annotation
  selectedAnnotationId: string | null;
  
  // Current preset
  currentPreset: PalletPreset;
  
  // History for undo/redo
  history: {
    past: Record<ViewType, PalletComponent[]>[];
    future: Record<ViewType, PalletComponent[]>[];
  };
}

// Actions
export interface AppActions {
  // Component actions
  addComponent: (component: Omit<PalletComponent, 'id'>) => void;
  updateComponent: (id: string, updates: Partial<PalletComponent>) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  duplicateComponent: (id: string) => void;
  
  // Annotation actions
  addAnnotation: (annotation: NewAnnotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  
  // View actions
  setActiveView: (view: ViewType) => void;
  
  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;
  
  // Specification actions
  updateSpecification: (updates: Partial<PalletSpecification>) => void;
  
  // Branding actions
  updateBranding: (updates: Partial<BrandingConfig>) => void;
  
  // Preset actions
  loadPreset: (preset: PalletPreset) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  
  // Reset
  resetCanvas: () => void;
}
