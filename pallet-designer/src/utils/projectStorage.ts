import type { AppState, ViewType, PalletComponent, Annotation } from '../types';

export interface ProjectMetadata {
  id: string;
  name: string;
  timestamp: number;
  thumbnail?: string;
}

export interface SavedProject {
  metadata: ProjectMetadata;
  state: Partial<AppState>;
}

const STORAGE_KEY = 'pallet-designer-projects';
const AUTOSAVE_KEY = 'pallet-designer-autosave';
const MAX_RECENT_PROJECTS = 10;
const VALID_VIEWS: ViewType[] = ['top', 'side', 'end', 'bottom'];

/**
 * Validates that a value is a valid ProjectMetadata object
 */
function isValidMetadata(value: unknown): value is ProjectMetadata {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Record<string, unknown>;
  return (
    typeof metadata.id === 'string' &&
    typeof metadata.name === 'string' &&
    typeof metadata.timestamp === 'number' &&
    (metadata.thumbnail === undefined || typeof metadata.thumbnail === 'string')
  );
}

/**
 * Validates that a value is a valid SavedProject object with required structure
 */
function isValidProject(value: unknown): value is SavedProject {
  if (!value || typeof value !== 'object') return false;
  const project = value as Record<string, unknown>;
  
  // Check metadata
  if (!isValidMetadata(project.metadata)) return false;
  
  // Check state exists and is an object
  if (!project.state || typeof project.state !== 'object') return false;
  
  const state = project.state as Record<string, unknown>;
  
  // If components exist, validate they are Record<ViewType, array>
  if (state.components !== undefined) {
    if (typeof state.components !== 'object' || state.components === null) return false;
    const components = state.components as Record<string, unknown>;
    for (const view of VALID_VIEWS) {
      if (components[view] !== undefined && !Array.isArray(components[view])) {
        return false;
      }
    }
  }
  
  // If annotations exist, validate they are Record<ViewType, array>
  if (state.annotations !== undefined) {
    if (typeof state.annotations !== 'object' || state.annotations === null) return false;
    const annotations = state.annotations as Record<string, unknown>;
    for (const view of VALID_VIEWS) {
      if (annotations[view] !== undefined && !Array.isArray(annotations[view])) {
        return false;
      }
    }
  }
  
  return true;
}

// Pre-real-mm saves stored geometry in "paper mm" (~1:10 of real). They lack
// canvas.drawingScale, which every real-mm save carries — so its absence flags a
// legacy file that must have its geometry scaled up to real mm exactly once.
const LEGACY_DRAWING_SCALE = 10;

function isLegacyPaperUnits(state: Partial<AppState>): boolean {
  const canvas = state.canvas as { drawingScale?: number } | undefined;
  return !canvas || typeof canvas.drawingScale !== 'number';
}

// Multiply all stored geometry (positions, dimensions, dimension values) in place.
function scaleGeometry(state: Partial<AppState>, factor: number): void {
  if (state.components) {
    for (const view of VALID_VIEWS) {
      const arr = state.components[view];
      if (!Array.isArray(arr)) continue;
      for (const c of arr as PalletComponent[]) {
        if (c.position) { c.position.x *= factor; c.position.y *= factor; }
        if (c.dimensions) {
          c.dimensions.width *= factor;
          c.dimensions.thickness *= factor;
          c.dimensions.length *= factor;
        }
      }
    }
  }
  if (state.annotations) {
    for (const view of VALID_VIEWS) {
      const arr = state.annotations[view];
      if (!Array.isArray(arr)) continue;
      for (const a of arr as Annotation[]) {
        if (a.type === 'text') {
          if (a.position) { a.position.x *= factor; a.position.y *= factor; }
        } else if (a.type === 'dimension') {
          if (a.startPosition) { a.startPosition.x *= factor; a.startPosition.y *= factor; }
          if (a.endPosition) { a.endPosition.x *= factor; a.endPosition.y *= factor; }
          if (typeof a.value === 'number') a.value *= factor;
        } else if (a.type === 'callout') {
          if (a.anchorPosition) { a.anchorPosition.x *= factor; a.anchorPosition.y *= factor; }
          if (a.textPosition) { a.textPosition.x *= factor; a.textPosition.y *= factor; }
        }
      }
    }
  }
}

/**
 * Sanitizes a project state to ensure it has required default values, and
 * migrates legacy paper-unit saves to real-world millimeters.
 */
function sanitizeProjectState(state: Partial<AppState>): Partial<AppState> {
  // Ensure components and annotations have all view keys
  const components = { ...state.components } as Record<ViewType, unknown[]>;
  const annotations = { ...state.annotations } as Record<ViewType, unknown[]>;

  for (const view of VALID_VIEWS) {
    if (!Array.isArray(components[view])) {
      components[view] = [];
    }
    if (!Array.isArray(annotations[view])) {
      annotations[view] = [];
    }
  }

  const result: Partial<AppState> = {
    ...state,
    components: components as AppState['components'],
    annotations: annotations as AppState['annotations'],
  };

  // One-time migration: convert old paper-mm geometry to real mm.
  if (isLegacyPaperUnits(result)) {
    scaleGeometry(result, LEGACY_DRAWING_SCALE);
    // Only stamp the scale onto an existing canvas; if there is none, leave it
    // undefined so loadState keeps the live defaults (drawingScale included).
    if (result.canvas) {
      result.canvas = {
        ...result.canvas,
        gridSize: (result.canvas.gridSize ?? 5) * LEGACY_DRAWING_SCALE,
        drawingScale: LEGACY_DRAWING_SCALE,
      };
    }
  }

  return result;
}

// Get all saved projects from localStorage
export function getRecentProjects(): SavedProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    
    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid projects data format, expected array');
      return [];
    }
    
    // Filter out invalid projects and sanitize valid ones
    return parsed
      .filter((item: unknown) => {
        if (!isValidProject(item)) {
          console.warn('Skipping invalid project:', item);
          return false;
        }
        return true;
      })
      .map((project: SavedProject) => ({
        ...project,
        state: sanitizeProjectState(project.state),
      }));
  } catch (error) {
    console.error('Failed to load recent projects:', error);
    return [];
  }
}

// Save project to localStorage
export function saveProjectToStorage(
  name: string,
  state: Partial<AppState>,
  thumbnail?: string
): ProjectMetadata {
  try {
    const metadata: ProjectMetadata = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      thumbnail,
    };

    const project: SavedProject = { metadata, state };
    
    const recentProjects = getRecentProjects();
    
    // Add new project to the beginning
    const updatedProjects = [project, ...recentProjects].slice(0, MAX_RECENT_PROJECTS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    
    return metadata;
  } catch (error) {
    console.error('Failed to save project:', error);
    throw new Error('Failed to save project to storage');
  }
}

// Load project from localStorage by ID
export function loadProjectFromStorage(projectId: string): SavedProject | null {
  try {
    const projects = getRecentProjects();
    return projects.find(p => p.metadata.id === projectId) || null;
  } catch (error) {
    console.error('Failed to load project:', error);
    return null;
  }
}

// Delete project from localStorage
export function deleteProjectFromStorage(projectId: string): void {
  try {
    const projects = getRecentProjects();
    const updatedProjects = projects.filter(p => p.metadata.id !== projectId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
}

// Export project as downloadable JSON file
export function exportProjectAsFile(name: string, state: Partial<AppState>): void {
  const project: SavedProject = {
    metadata: {
      id: `project-${Date.now()}`,
      name,
      timestamp: Date.now(),
    },
    state,
  };

  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pallet`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Import project from uploaded JSON file
export function importProjectFromFile(file: File): Promise<SavedProject> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.pallet') && !file.name.endsWith('.json')) {
      reject(new Error('Invalid file type. Please upload a .pallet file'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Validate project structure using type guard
        if (!isValidProject(parsed)) {
          reject(new Error('Invalid project file format. File may be corrupted or from an incompatible version.'));
          return;
        }
        
        // Sanitize the state to ensure all required fields exist
        const project: SavedProject = {
          metadata: parsed.metadata,
          state: sanitizeProjectState(parsed.state),
        };
        
        resolve(project);
      } catch {
        reject(new Error('Failed to parse project file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Generate a simple thumbnail from canvas (for recent projects preview)
export function generateThumbnail(canvasElement: HTMLCanvasElement | null): string | undefined {
  if (!canvasElement) return undefined;
  
  try {
    // Create a small thumbnail (200x150)
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = 200;
    thumbnailCanvas.height = 150;
    const ctx = thumbnailCanvas.getContext('2d');
    
    if (!ctx) return undefined;
    
    // Draw scaled-down version
    ctx.drawImage(canvasElement, 0, 0, 200, 150);
    
    return thumbnailCanvas.toDataURL('image/png');
  } catch {
    console.error('Failed to generate thumbnail');
    return undefined;
  }
}

// ---- Autosave (crash / refresh recovery) ----
// A single rolling snapshot of the working design, written frequently so an
// accidental refresh or tab close never loses work. This is separate from the
// named "recent projects" list above (which the user saves explicitly).

// Only the serializable, design-relevant slices are stored — never the undo
// history, transient selection, or the (non-serializable) export function.
const AUTOSAVE_FIELDS = [
  'components',
  'annotations',
  'specification',
  'branding',
  'currentPreset',
  'canvas',
  'finalViewConfig',
  'finalTextConfig',
] as const;

// Build the snapshot to persist from the full store state.
export function buildAutosaveSnapshot(state: AppState): Partial<AppState> {
  const snapshot: Record<string, unknown> = {};
  for (const key of AUTOSAVE_FIELDS) {
    snapshot[key] = state[key];
  }
  return snapshot as Partial<AppState>;
}

export function saveAutosave(state: Partial<AppState>): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures (private mode / quota / disabled storage)
  }
}

export function loadAutosave(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Reuse the same sanitizer as project import so missing view arrays are backfilled.
    return sanitizeProjectState(parsed as Partial<AppState>);
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // Ignore
  }
}

// True only when a snapshot actually contains user-drawn content, so we don't
// restore (or skip the landing page for) an empty recovery.
export function autosaveHasContent(state: Partial<AppState> | null): boolean {
  if (!state) return false;
  const buckets = [
    ...(state.components ? Object.values(state.components) : []),
    ...(state.annotations ? Object.values(state.annotations) : []),
  ];
  return buckets.some((arr) => Array.isArray(arr) && arr.length > 0);
}
