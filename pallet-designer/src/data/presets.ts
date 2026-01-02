import type { PalletComponent, ViewType, PalletPreset } from '../types';

// Pallet preset dimensions (in mm) - Real world dimensions for reference
const PALLET_DIMENSIONS: Record<PalletPreset, { length: number; width: number; height: number }> = {
  'euro-epal': { length: 1200, width: 800, height: 144 },
  'gma': { length: 1219, width: 1016, height: 150 },
  'cp1': { length: 1000, width: 1200, height: 138 },
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
  'custom': 'Design your own custom pallet from scratch',
};
