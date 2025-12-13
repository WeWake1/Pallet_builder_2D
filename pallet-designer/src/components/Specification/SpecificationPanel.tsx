import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { PalletSpecification, BrandingConfig } from '../../types';

interface SpecificationPanelProps {
  onClose?: () => void;
}

export function SpecificationPanel({ onClose }: SpecificationPanelProps) {
  const { specification, updateSpecification, branding, updateBranding } = useStore();
  const [localSpec, setLocalSpec] = useState<PalletSpecification>(specification);
  const [localBranding, setLocalBranding] = useState<BrandingConfig>(branding);
  const [activeSection, setActiveSection] = useState<'dimensions' | 'classification' | 'materials' | 'branding'>('dimensions');

  const handleSave = () => {
    updateSpecification(localSpec);
    updateBranding(localBranding);
    onClose?.();
  };

  const updateLocal = <K extends keyof PalletSpecification>(
    key: K,
    value: PalletSpecification[K]
  ) => {
    setLocalSpec((prev) => ({ ...prev, [key]: value }));
  };

  const updateLocalBranding = <K extends keyof BrandingConfig>(
    key: K,
    value: BrandingConfig[K]
  ) => {
    setLocalBranding((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Pallet Specifications
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {(['dimensions', 'classification', 'materials', 'branding'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              activeSection === section
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {section === 'branding' ? 'Brand' : section}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'dimensions' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Pallet ID
              </label>
              <input
                type="text"
                value={localSpec.palletId}
                onChange={(e) => updateLocal('palletId', e.target.value)}
                placeholder="e.g., EURO-1200x800"
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Length (mm)
                </label>
                <input
                  type="number"
                  value={localSpec.overallDimensions.length}
                  onChange={(e) =>
                    updateLocal('overallDimensions', {
                      ...localSpec.overallDimensions,
                      length: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Width (mm)
                </label>
                <input
                  type="number"
                  value={localSpec.overallDimensions.width}
                  onChange={(e) =>
                    updateLocal('overallDimensions', {
                      ...localSpec.overallDimensions,
                      width: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Height (mm)
                </label>
                <input
                  type="number"
                  value={localSpec.overallDimensions.height}
                  onChange={(e) =>
                    updateLocal('overallDimensions', {
                      ...localSpec.overallDimensions,
                      height: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'classification' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Pallet Type
              </label>
              <select
                value={localSpec.classification.type}
                onChange={(e) =>
                  updateLocal('classification', {
                    ...localSpec.classification,
                    type: e.target.value as 'block-class' | 'stringer-class',
                  })
                }
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="block-class">Block Class</option>
                <option value="stringer-class">Stringer Class</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Deck Face
              </label>
              <select
                value={localSpec.classification.face}
                onChange={(e) =>
                  updateLocal('classification', {
                    ...localSpec.classification,
                    face: e.target.value as 'double-face' | 'single-face',
                  })
                }
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="double-face">Double Face</option>
                <option value="single-face">Single Face</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Reversibility
              </label>
              <select 
                value={localSpec.classification.reversible}
                onChange={(e) =>
                  updateLocal('classification', {
                    ...localSpec.classification,
                    reversible: e.target.value as 'reversible' | 'non-reversible',
                  })
                }
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="reversible">Reversible</option>
                <option value="non-reversible">Non-Reversible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Entry Type
              </label>
              <select
                value={localSpec.classification.entry}
                onChange={(e) =>
                  updateLocal('classification', {
                    ...localSpec.classification,
                    entry: e.target.value as '2-way' | '4-way',
                  })
                }
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="4-way">4-Way Entry</option>
                <option value="2-way">2-Way Entry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Usage
              </label>
              <select
                value={localSpec.classification.usage}
                onChange={(e) =>
                  updateLocal('classification', {
                    ...localSpec.classification,
                    usage: e.target.value as 'single-use' | 'multiple-use',
                  })
                }
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="multiple-use">Multiple Use</option>
                <option value="single-use">Single Use</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'materials' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Lumber ID / Wood Type
              </label>
              <input
                type="text"
                value={localSpec.materials.lumberId}
                onChange={(e) =>
                  updateLocal('materials', {
                    ...localSpec.materials,
                    lumberId: e.target.value,
                  })
                }
                placeholder="e.g., Pine Wood, Hardwood"
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Surface Finish
              </label>
              <input
                type="text"
                value={localSpec.materials.surface}
                onChange={(e) =>
                  updateLocal('materials', {
                    ...localSpec.materials,
                    surface: e.target.value,
                  })
                }
                placeholder="e.g., S4S Planed, Rough Sawn"
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Static Load (kg)
                </label>
                <input
                  type="number"
                  value={localSpec.materials.staticLoadCapacity}
                  onChange={(e) =>
                    updateLocal('materials', {
                      ...localSpec.materials,
                      staticLoadCapacity: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Dynamic Load (kg)
                </label>
                <input
                  type="number"
                  value={localSpec.materials.dynamicLoadCapacity}
                  onChange={(e) =>
                    updateLocal('materials', {
                      ...localSpec.materials,
                      dynamicLoadCapacity: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Pallet Tolerance (mm)
              </label>
              <input
                type="number"
                value={localSpec.materials.palletTolerance}
                onChange={(e) =>
                  updateLocal('materials', {
                    ...localSpec.materials,
                    palletTolerance: Number(e.target.value),
                  })
                }
                step="0.1"
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Width Tolerance (mm)
                </label>
                <input
                  type="number"
                  value={localSpec.materials.componentTolerance.width}
                  onChange={(e) =>
                    updateLocal('materials', {
                      ...localSpec.materials,
                      componentTolerance: {
                        ...localSpec.materials.componentTolerance,
                        width: Number(e.target.value),
                      },
                    })
                  }
                  step="0.1"
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Thickness Tolerance (mm)
                </label>
                <input
                  type="number"
                  value={localSpec.materials.componentTolerance.thickness}
                  onChange={(e) =>
                    updateLocal('materials', {
                      ...localSpec.materials,
                      componentTolerance: {
                        ...localSpec.materials.componentTolerance,
                        thickness: Number(e.target.value),
                      },
                    })
                  }
                  step="0.1"
                  className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'branding' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={localBranding.companyName}
                onChange={(e) => updateLocalBranding('companyName', e.target.value)}
                placeholder="Your company name"
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Logo URL
              </label>
              <input
                type="text"
                value={localBranding.logoUrl}
                onChange={(e) => updateLocalBranding('logoUrl', e.target.value)}
                placeholder="/logo.png or https://..."
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              {localBranding.logoUrl && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                  <img 
                    src={localBranding.logoUrl} 
                    alt="Logo preview" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Watermark Text
              </label>
              <input
                type="text"
                value={localBranding.watermarkText}
                onChange={(e) => updateLocalBranding('watermarkText', e.target.value)}
                placeholder="Text for PDF watermark"
                className="w-full h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localBranding.primaryColor}
                    onChange={(e) => updateLocalBranding('primaryColor', e.target.value)}
                    className="w-10 h-9 border border-[var(--color-border)] rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localBranding.primaryColor}
                    onChange={(e) => updateLocalBranding('primaryColor', e.target.value)}
                    className="flex-1 h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localBranding.secondaryColor}
                    onChange={(e) => updateLocalBranding('secondaryColor', e.target.value)}
                    className="w-10 h-9 border border-[var(--color-border)] rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localBranding.secondaryColor}
                    onChange={(e) => updateLocalBranding('secondaryColor', e.target.value)}
                    className="flex-1 h-9 px-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 h-9 px-4 border border-[var(--color-border)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 h-9 px-4 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Save Specifications
        </button>
      </div>
    </div>
  );
}
