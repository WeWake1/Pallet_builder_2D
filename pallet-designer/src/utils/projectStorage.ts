import type { AppState } from '../types';

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
const MAX_RECENT_PROJECTS = 10;

// Get all saved projects from localStorage
export function getRecentProjects(): SavedProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
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
        const project = JSON.parse(content) as SavedProject;
        
        // Validate project structure
        if (!project.metadata || !project.state) {
          reject(new Error('Invalid project file format'));
          return;
        }
        
        resolve(project);
      } catch (error) {
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
