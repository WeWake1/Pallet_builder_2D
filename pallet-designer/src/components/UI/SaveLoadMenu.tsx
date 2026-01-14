import { useState, useRef } from 'react';
import { Save, FolderOpen, Download, Upload, Clock, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  saveProjectToStorage,
  exportProjectAsFile,
  importProjectFromFile,
  getRecentProjects,
  deleteProjectFromStorage,
  type SavedProject,
} from '../../utils/projectStorage';

interface SaveLoadMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveLoadMenu({ isOpen, onClose }: SaveLoadMenuProps) {
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  const [projectName, setProjectName] = useState('My Pallet Design');
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>(getRecentProjects());
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    components, 
    annotations, 
    specification, 
    branding, 
    currentPreset,
    canvas,
    loadState,
  } = useStore();

  const handleSaveToStorage = () => {
    setIsSaving(true);
    try {
      const state = {
        components,
        annotations,
        specification,
        branding,
        currentPreset,
        canvas,
      };

      saveProjectToStorage(projectName, state);
      setRecentProjects(getRecentProjects());
      
      alert('✅ Project saved successfully!');
      onClose();
    } catch (error) {
      alert('❌ Failed to save project. Please try again.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportFile = () => {
    try {
      const state = {
        components,
        annotations,
        specification,
        branding,
        currentPreset,
        canvas,
      };

      exportProjectAsFile(projectName, state);
      alert('✅ Project exported successfully!');
    } catch (error) {
      alert('❌ Failed to export project. Please try again.');
      console.error(error);
    }
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const project = await importProjectFromFile(file);
      
      if (confirm(`Load project "${project.metadata.name}"? This will replace your current work.`)) {
        loadState(project.state);
        alert('✅ Project loaded successfully!');
        onClose();
      }
    } catch (error) {
      alert('❌ Failed to import project. Please check the file format.');
      console.error(error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    if (confirm(`Load "${project.metadata.name}"? This will replace your current work.`)) {
      loadState(project.state);
      alert('✅ Project loaded successfully!');
      onClose();
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Delete "${projectName}"? This cannot be undone.`)) {
      deleteProjectFromStorage(projectId);
      setRecentProjects(getRecentProjects());
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-16 right-4 z-50 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'save'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Project
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'load'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-2" />
            Load Project
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSaveToStorage}
                  disabled={isSaving || !projectName.trim()}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save to Browser'}
                </button>

                <button
                  onClick={handleExportFile}
                  disabled={!projectName.trim()}
                  className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download as File
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Save to browser for quick access or download as .pallet file for backup
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleImportFile}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import from File
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pallet,.json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Projects ({recentProjects.length})
                </h3>
                
                {recentProjects.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No recent projects yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentProjects.map((project) => (
                      <div
                        key={project.metadata.id}
                        className="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => handleLoadProject(project)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {project.metadata.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {formatDate(project.metadata.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.metadata.id, project.metadata.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
