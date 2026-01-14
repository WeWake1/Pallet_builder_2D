import { useEffect } from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    category: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
    ],
  },
  {
    category: 'Editing',
    shortcuts: [
      { keys: ['Ctrl', 'C'], description: 'Copy selected object' },
      { keys: ['Ctrl', 'V'], description: 'Paste object' },
      { keys: ['Ctrl', 'X'], description: 'Cut selected object' },
      { keys: ['Delete'], description: 'Delete selected object' },
      { keys: ['Backspace'], description: 'Delete selected object' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected object' },
    ],
  },
  {
    category: 'Selection',
    shortcuts: [
      { keys: ['Shift', 'Click'], description: 'Multi-select objects' },
      { keys: ['Ctrl', 'Click'], description: 'Multi-select objects (Windows)' },
      { keys: ['Cmd', 'Click'], description: 'Multi-select objects (Mac)' },
      { keys: ['Ctrl', 'A'], description: 'Select all objects' },
      { keys: ['Escape'], description: 'Deselect all' },
      { keys: ['Ctrl', 'G'], description: 'Group selected objects' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup objects' },
    ],
  },
  {
    category: 'Layer Ordering',
    shortcuts: [
      { keys: ['Ctrl', ']'], description: 'Bring forward' },
      { keys: ['Ctrl', '['], description: 'Send backward' },
      { keys: ['Ctrl', 'Shift', ']'], description: 'Bring to front' },
      { keys: ['Ctrl', 'Shift', '['], description: 'Send to back' },
    ],
  },
  {
    category: 'Canvas Navigation',
    shortcuts: [
      { keys: ['Pinch'], description: 'Zoom in/out (trackpad)' },
      { keys: ['Ctrl', 'Scroll'], description: 'Zoom in/out (mouse)' },
      { keys: ['Arrow Keys'], description: 'Move selected object' },
    ],
  },
  {
    category: 'View Switching',
    shortcuts: [
      { keys: ['1'], description: 'Switch to Top view' },
      { keys: ['2'], description: 'Switch to Side view' },
      { keys: ['3'], description: 'Switch to End view' },
      { keys: ['4'], description: 'Switch to Bottom view' },
    ],
  },
];

// Split shortcuts into two balanced columns
const leftColumnCategories = ['General', 'Editing', 'Selection'];
const rightColumnCategories = ['Layer Ordering', 'Canvas Navigation', 'View Switching'];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Master these shortcuts to speed up your workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="space-y-6">
              {SHORTCUTS.filter(cat => leftColumnCategories.includes(cat.category)).map((category, catIdx, arr) => (
                <div key={category.category}>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 pr-4">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm min-w-8 text-center whitespace-nowrap">
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="text-gray-400 dark:text-gray-500 text-xs">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {catIdx < arr.length - 1 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {SHORTCUTS.filter(cat => rightColumnCategories.includes(cat.category)).map((category, catIdx, arr) => (
                <div key={category.category}>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 pr-4">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm min-w-8 text-center whitespace-nowrap">
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="text-gray-400 dark:text-gray-500 text-xs">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {catIdx < arr.length - 1 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Click the "Keyboard Shortcuts" button in the Canvas Settings panel anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}
