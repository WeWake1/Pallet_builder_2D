import type { PalletComponent, ViewType, PalletPreset } from '../types';

// Pallet preset dimensions (in mm) - Real world dimensions for reference
const PALLET_DIMENSIONS: Record<PalletPreset, { length: number; width: number; height: number }> = {
  'euro-epal': { length: 1200, width: 800, height: 144 },
  'gma': { length: 1219, width: 1016, height: 150 },
  'cp1': { length: 1000, width: 1200, height: 138 },
  'cp2': { length: 800, width: 1200, height: 138 },
  'cp3': { length: 1140, width: 1140, height: 138 },
  'cp4': { length: 1100, width: 1300, height: 138 },
  'cp5': { length: 760, width: 1140, height: 138 },
  'cp6': { length: 1200, width: 1000, height: 138 },
  'cp7': { length: 1300, width: 1100, height: 138 },
  'cp8': { length: 1140, width: 1140, height: 138 },
  'cp9': { length: 1140, width: 1140, height: 156 },
  'custom': { length: 1200, width: 800, height: 144 },
};

// Empty preset - user builds from scratch using drag-and-drop
function createEmptyPreset(): Record<ViewType, Omit<PalletComponent, 'id' | 'view'>[]> {
  return {
    top: [],
    side: [],
    end: [],
    bottom: [],
  };
}

// Get preset components by preset name
// For now, all presets return empty - user builds custom designs
export function getPresetComponents(_preset: PalletPreset): Record<ViewType, Omit<PalletComponent, 'id' | 'view'>[]> | null {
  // All presets currently return empty canvas
  // Templates feature will be implemented later
  return createEmptyPreset();
}

// Get pallet dimensions by preset
export function getPresetDimensions(preset: PalletPreset) {
  return PALLET_DIMENSIONS[preset] || PALLET_DIMENSIONS['custom'];
}

// Preset descriptions for UI
export const PRESET_DESCRIPTIONS: Record<PalletPreset, string> = {
  'euro-epal': 'European standard pallet (1200×800mm) - Start with empty canvas',
  'gma': 'GMA pallet (48×40") - Start with empty canvas',
  'cp1': 'Chemical pallet CP1 (1000×1200mm) - Start with empty canvas',
  'cp2': 'Chemical pallet CP2 (800×1200mm) - Start with empty canvas',
  'cp3': 'Chemical pallet CP3 (1140×1140mm) - Start with empty canvas',
  'cp4': 'Chemical pallet CP4 (1100×1300mm) - Start with empty canvas',
  'cp5': 'Chemical pallet CP5 (760×1140mm) - Start with empty canvas',
  'cp6': 'Chemical pallet CP6 (1200×1000mm) - Start with empty canvas',
  'cp7': 'Chemical pallet CP7 (1300×1100mm) - Start with empty canvas',
  'cp8': 'Chemical pallet CP8 (1140×1140mm) - Start with empty canvas',
  'cp9': 'Chemical pallet CP9 (1140×1140mm) - Start with empty canvas',
  'custom': 'Design your own custom pallet from scratch',
};
