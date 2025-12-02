import { useState } from 'react';
import { useStore, useCanUndo, useCanRedo } from '../../store/useStore';
import { PALLET_PRESETS } from '../../constants';
import { exportToPDF } from '../../utils/pdfExport';
import { getGlobalFabricCanvas } from '../../hooks/useFabricCanvas';

interface HeaderProps {
  onOpenSpecs?: () => void;
}

export function Header({ onOpenSpecs }: HeaderProps) {
  const { 
    currentPreset, 
    loadPreset, 
    undo, 
    redo, 
    resetCanvas, 
    branding,
    components,
    specification
  } = useStore();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Get the current canvas data URL
      const fabricCanvas = getGlobalFabricCanvas();
      const canvasDataUrl = fabricCanvas?.toDataURL({ format: 'png', multiplier: 2 }) || undefined;
      
      await exportToPDF({
        components,
        specification,
        branding,
        currentPreset,
        canvasDataUrl
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-4 shrink-0">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        {branding.logoUrl ? (
          <img 
            src={branding.logoUrl} 
            alt={branding.companyName} 
            className="h-10 w-auto object-contain"
          />
        ) : (
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PD</span>
          </div>
        )}
        <div className="hidden sm:block">
          <h1 className="text-base font-semibold text-[var(--color-text)] leading-tight">
            Pallet Designer
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] leading-tight">
            {branding.companyName}
          </p>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="preset" className="text-sm text-[var(--color-text-muted)] hidden md:block">
          Template:
        </label>
        <select
          id="preset"
          value={currentPreset}
          onChange={(e) => loadPreset(e.target.value as typeof currentPreset)}
          className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        >
          {PALLET_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset the canvas?')) {
              resetCanvas();
            }
          }}
          className="hidden sm:flex w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] items-center justify-center hover:bg-gray-50 transition-colors"
          title="Reset Canvas"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Specifications */}
        <button
          onClick={onOpenSpecs}
          className="hidden sm:flex w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] items-center justify-center hover:bg-gray-50 transition-colors"
          title="Edit Specifications"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Export Button */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="h-9 px-4 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isExporting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>
      </div>
    </header>
  );
}
