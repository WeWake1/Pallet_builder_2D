import type { PalletComponent, ViewType, PalletPreset } from '../types';

// Pallet preset dimensions (in mm)
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

// Euro EPAL (1200x800mm) - Block Class, 9 blocks, reversible
// https://www.epal-pallets.org/eu-en/load-carriers/epal-euro-pallet
function createEuroEPALPreset(): Record<ViewType, Omit<PalletComponent, 'id' | 'view'>[]> {
  const palletLength = 1200;
  const palletWidth = 800;
  
  // Block dimensions: 145x145x78mm (standard Euro block)
  const blockWidth = 145;
  const blockLength = 145;
  const blockThickness = 78;
  
  // Deck board dimensions: typically 145x22mm or 100x22mm
  const deckBoardWidth = 145;
  const deckBoardThickness = 22;
  const narrowBoardWidth = 100;
  
  // Stringer dimensions: 145x22mm
  const stringerWidth = 145;
  const stringerThickness = 22;
  
  return {
    top: [
      // 5 top deck boards (3 wide + 2 narrow)
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: narrowBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 188 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 327.5 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: narrowBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 512 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 655 }, rotation: 0 },
    ],
    side: [
      // Side view shows blocks (3 across) and stringers
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 0, y: 22 }, rotation: 0 },
      { type: 'block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 527.5, y: 22 }, rotation: 0 },
      { type: 'block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 1055, y: 22 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 100 }, rotation: 0 },
    ],
    end: [
      // End view shows 3 blocks in a row
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 0, y: 22 }, rotation: 0 },
      { type: 'block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 327.5, y: 22 }, rotation: 0 },
      { type: 'block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 655, y: 22 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 0, y: 100 }, rotation: 0 },
    ],
    bottom: [
      // Bottom has 3 stringers running length-wise
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 327.5 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 655 }, rotation: 0 },
    ],
  };
}

// GMA Pallet (1219x1016mm / 48x40 inches) - Stringer Class with notched blocks
function createGMAPreset(): Record<ViewType, Omit<PalletComponent, 'id' | 'view'>[]> {
  const palletLength = 1219; // 48 inches
  const palletWidth = 1016; // 40 inches
  
  // GMA uses stringer construction with notched stringers
  const stringerWidth = 89;  // 3.5 inches
  const stringerThickness = 89; // 3.5 inches
  const stringerLength = palletLength;
  
  const deckBoardWidth = 140;
  const deckBoardThickness = 16;
  
  return {
    top: [
      // 7 deck boards on top
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 146 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 292 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 438 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 584 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 730 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 876 }, rotation: 0 },
    ],
    side: [
      // Side view - 3 stringers with notches
      { type: 'deck-board', dimensions: { width: palletWidth, thickness: deckBoardThickness, length: deckBoardWidth }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'notched-block', dimensions: { width: stringerWidth, thickness: stringerThickness, length: stringerLength }, position: { x: 0, y: 16 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: palletWidth, thickness: deckBoardThickness, length: deckBoardWidth }, position: { x: 0, y: 105 }, rotation: 0 },
    ],
    end: [
      // End view
      { type: 'deck-board', dimensions: { width: palletLength, thickness: deckBoardThickness, length: deckBoardWidth }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'notched-block', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 0, y: 16 }, rotation: 0 },
      { type: 'notched-block', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 463, y: 16 }, rotation: 0 },
      { type: 'notched-block', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 927, y: 16 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: palletLength, thickness: deckBoardThickness, length: deckBoardWidth }, position: { x: 0, y: 105 }, rotation: 0 },
    ],
    bottom: [
      // Bottom has 5 bottom boards
      { type: 'lead-board', dimensions: { width: 100, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'lead-board', dimensions: { width: 100, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 229 }, rotation: 0 },
      { type: 'lead-board', dimensions: { width: 100, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 458 }, rotation: 0 },
      { type: 'lead-board', dimensions: { width: 100, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 687 }, rotation: 0 },
      { type: 'lead-board', dimensions: { width: 100, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 916 }, rotation: 0 },
    ],
  };
}

// CP Pallets (Chemical/Pharmaceutical industry) - with chamfered blocks
function createCPPreset(variant: 'cp1' | 'cp2' | 'cp3' | 'cp4' | 'cp5' | 'cp6' | 'cp7' | 'cp8' | 'cp9'): Record<ViewType, Omit<PalletComponent, 'id' | 'view'>[]> {
  const dims = PALLET_DIMENSIONS[variant];
  const palletLength = dims.length;
  const palletWidth = dims.width;
  
  // CP pallets use chamfered blocks for chemical industry
  const blockWidth = 145;
  const blockLength = 145;
  const blockThickness = 78;
  
  const deckBoardWidth = 140;
  const deckBoardThickness = 22;
  
  const stringerWidth = 145;
  const stringerThickness = 22;
  
  return {
    top: [
      // 5 top deck boards
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: (palletWidth - deckBoardWidth) / 4 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: (palletWidth - deckBoardWidth) / 2 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: (palletWidth - deckBoardWidth) * 3 / 4 }, rotation: 0 },
      { type: 'deck-board', dimensions: { width: deckBoardWidth, thickness: deckBoardThickness, length: palletLength }, position: { x: 0, y: palletWidth - deckBoardWidth }, rotation: 0 },
    ],
    side: [
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'chamfered-block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 0, y: 22 }, rotation: 0 },
      { type: 'chamfered-block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: (palletLength - blockWidth) / 2, y: 22 }, rotation: 0 },
      { type: 'chamfered-block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: palletLength - blockWidth, y: 22 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 100 }, rotation: 0 },
    ],
    end: [
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'chamfered-block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: 0, y: 22 }, rotation: 0 },
      { type: 'chamfered-block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: (palletWidth - blockWidth) / 2, y: 22 }, rotation: 0 },
      { type: 'chamfered-block', dimensions: { width: blockWidth, thickness: blockThickness, length: blockLength }, position: { x: palletWidth - blockWidth, y: 22 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletWidth }, position: { x: 0, y: 100 }, rotation: 0 },
    ],
    bottom: [
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: (palletWidth - stringerWidth) / 2 }, rotation: 0 },
      { type: 'stringer', dimensions: { width: stringerWidth, thickness: stringerThickness, length: palletLength }, position: { x: 0, y: palletWidth - stringerWidth }, rotation: 0 },
    ],
  };
}

// Get preset components by preset name
export function getPresetComponents(preset: PalletPreset): Record<ViewType, Omit<PalletComponent, 'id' | 'view'>[]> | null {
  switch (preset) {
    case 'euro-epal':
      return createEuroEPALPreset();
    case 'gma':
      return createGMAPreset();
    case 'cp1':
    case 'cp2':
    case 'cp3':
    case 'cp4':
    case 'cp5':
    case 'cp6':
    case 'cp7':
    case 'cp8':
    case 'cp9':
      return createCPPreset(preset);
    case 'custom':
    default:
      return null;
  }
}

// Get pallet dimensions by preset
export function getPresetDimensions(preset: PalletPreset) {
  return PALLET_DIMENSIONS[preset] || PALLET_DIMENSIONS['custom'];
}

// Preset descriptions for UI
export const PRESET_DESCRIPTIONS: Record<PalletPreset, string> = {
  'euro-epal': 'European standard pallet (1200×800mm) with 9 blocks, 4-way entry',
  'gma': 'Grocery Manufacturers Association (48×40") with notched stringers',
  'cp1': 'Chemical pallet (1000×1200mm) with chamfered blocks',
  'cp2': 'Chemical pallet (800×1200mm) with chamfered blocks',
  'cp3': 'Chemical pallet (1140×1140mm) with chamfered blocks',
  'cp4': 'Chemical pallet (1100×1300mm) with chamfered blocks',
  'cp5': 'Chemical pallet (760×1140mm) with chamfered blocks',
  'cp6': 'Chemical pallet (1200×1000mm) with chamfered blocks',
  'cp7': 'Chemical pallet (1300×1100mm) with chamfered blocks',
  'cp8': 'Chemical pallet (1140×1140mm) with chamfered blocks',
  'cp9': 'Chemical pallet (1140×1140mm) reinforced with chamfered blocks',
  'custom': 'Design your own custom pallet from scratch',
};
