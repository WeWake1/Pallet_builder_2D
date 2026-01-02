import type { ComponentDefinition, PalletPreset, ViewType } from '../types';

// A4 dimensions in mm
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Canvas scale (pixels per mm for display)
export const CANVAS_SCALE = 2; // 2 pixels per mm

// A4 dimensions in pixels for canvas
export const A4_WIDTH_PX = A4_WIDTH_MM * CANVAS_SCALE;
export const A4_HEIGHT_PX = A4_HEIGHT_MM * CANVAS_SCALE;

// Grid settings
export const DEFAULT_GRID_SIZE = 5; // 5mm grid (finer for precision)

// View labels
export const VIEW_LABELS: Record<ViewType, { label: string; arrow: string }> = {
  top: { label: 'Top View', arrow: 'A' },
  side: { label: 'Side View', arrow: 'B' },
  end: { label: 'End View', arrow: 'C' },
  bottom: { label: 'Bottom View', arrow: 'D' },
};

// Default component dimensions (in mm) - Scaled for A4 canvas display
// These represent the component size on the canvas/paper, not real-world size
// For a pallet drawing, think of this as 1:10 scale (10mm paper = 100mm real)
export const DEFAULT_COMPONENT_DIMENSIONS: Record<string, { width: number; thickness: number; length: number }> = {
  'top-board': { width: 10, thickness: 2, length: 100 },         // Top Board
  'centre-board': { width: 15, thickness: 2, length: 120 },           // Centre Board
  'block': { width: 15, thickness: 8, length: 15 },               // Block
  'bottom-board': { width: 10, thickness: 2, length: 100 },       // Bottom Board
};

// GMA Notch specifications (in mm)
export const GMA_NOTCH_SPECS = {
  depth: 38,      // 1.5 inches
  width: 89,      // 3.5 inches (full block width)
  height: 22,     // Depth of the notch cut
};

// Chamfer specifications (in mm)  
export const CHAMFER_SPECS = {
  size: 15,       // 15mm chamfer on corners
  angle: 45,      // 45-degree angle
};

// Component definitions for the palette
export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    type: 'top-board',
    name: 'Top Board',
    icon: '▬',
    defaultDimensions: DEFAULT_COMPONENT_DIMENSIONS['top-board'],
    description: 'Vertical plank',
  },
  {
    type: 'centre-board',
    name: 'Centre Board',
    icon: '═',
    defaultDimensions: DEFAULT_COMPONENT_DIMENSIONS['centre-board'],
    description: 'Horizontal, darker board',
  },
  {
    type: 'block',
    name: 'Block',
    icon: '▢',
    defaultDimensions: DEFAULT_COMPONENT_DIMENSIONS['block'],
    description: 'Standard support block',
  },
  {
    type: 'bottom-board',
    name: 'Bottom Board',
    icon: '▬',
    defaultDimensions: DEFAULT_COMPONENT_DIMENSIONS['bottom-board'],
    description: 'Bottom most plank',
  },
];

// Pallet preset names
export const PALLET_PRESETS: { value: PalletPreset; label: string }[] = [
  { value: 'custom', label: 'Custom Pallet' },
  { value: 'euro-epal', label: 'Euro EPAL (1200×800)' },
  { value: 'gma', label: 'GMA (1219×1016)' },
  { value: 'cp1', label: 'CP1 (1000×1200)' },
];

// Classification options
export const CLASSIFICATION_OPTIONS = {
  type: [
    { value: 'block-class', label: 'Block-Class' },
    { value: 'stringer-class', label: 'Stringer-Class' },
  ],
  face: [
    { value: 'double-face', label: 'Double-Face' },
    { value: 'single-face', label: 'Single-Face' },
  ],
  reversible: [
    { value: 'reversible', label: 'Reversible' },
    { value: 'non-reversible', label: 'Non-Reversible' },
  ],
  entry: [
    { value: '2-way', label: '2-Way Entry' },
    { value: '4-way', label: 'Full 4-Way Entry' },
  ],
  usage: [
    { value: 'single-use', label: 'Single-Use' },
    { value: 'multiple-use', label: 'Multiple-Use' },
  ],
};

// Lumber options (can be expanded)
export const LUMBER_OPTIONS = [
  'Pine Wood',
  'Oak',
  'Birch',
  'Spruce',
  'Mixed Hardwood',
  'Recycled Wood',
];

// Surface options
export const SURFACE_OPTIONS = [
  'S4S Planed',
  'Rough Sawn',
  'Heat Treated',
  'Kiln Dried',
];

// Default tolerances
export const DEFAULT_TOLERANCES = {
  componentWidth: 5, // ±5mm
  componentThickness: 2, // ±2mm
  pallet: 5, // ±5mm
};

// Default load capacities (in Kgs)
export const DEFAULT_LOAD_CAPACITIES = {
  static: 1000,
  dynamic: 750,
};

// PDF export settings
export const PDF_SETTINGS = {
  dpi: 300,
  marginMm: 10,
  format: 'a4' as const,
  orientation: 'portrait' as const,
};

// Touch settings
export const TOUCH_SETTINGS = {
  minTouchTarget: 44, // minimum touch target size in pixels
  longPressDuration: 500, // ms for long press
  doubleTapDuration: 300, // ms between taps for double tap
};

// Zoom limits
export const ZOOM_LIMITS = {
  min: 0.25,
  max: 4,
  step: 0.1,
};

// Colors for components on canvas
export const COMPONENT_COLORS = {
  'top-board': {
    fill: '#d4a574',
    stroke: '#8b6914',
  },
  'centre-board': {
    fill: '#a07040',
    stroke: '#8b6914',
  },
  'block': {
    fill: '#e5c49a',
    stroke: '#8b6914',
  },
  'bottom-board': {
    fill: '#d4a574',
    stroke: '#8b6914',
  },
};
