import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';

interface ContextMenuProps {
  x: number;
  y: number;
  componentId: string | null;
  annotationId: string | null;
  onClose: () => void;
}

export function ContextMenu({ x, y, componentId, annotationId, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { 
    deleteComponent, 
    duplicateComponent, 
    bringToFront, 
    bringForward, 
    sendToBack, 
    sendBackward,
    copyComponent,
    pasteComponent,
    deleteAnnotation,
    bringAnnotationToFront,
    bringAnnotationForward,
    sendAnnotationToBack,
    sendAnnotationBackward,
    copyAnnotation,
    duplicateAnnotation,
  } = useStore();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCopy = () => {
    if (componentId) {
      copyComponent(componentId);
    }
    if (annotationId) {
      copyAnnotation(annotationId);
    }
    onClose();
  };

  const handlePaste = () => {
    pasteComponent();
    onClose();
  };

  const handleDuplicate = () => {
    if (componentId) {
      duplicateComponent(componentId);
    }
    if (annotationId) {
      duplicateAnnotation(annotationId);
    }
    onClose();
  };

  const handleDelete = () => {
    if (componentId) {
      deleteComponent(componentId);
    }
    if (annotationId) {
      deleteAnnotation(annotationId);
    }
    onClose();
  };

  const handleBringToFront = () => {
    if (componentId) {
      bringToFront(componentId);
    }
    if (annotationId) {
      bringAnnotationToFront(annotationId);
    }
    onClose();
  };

  const handleBringForward = () => {
    if (componentId) {
      bringForward(componentId);
    }
    if (annotationId) {
      bringAnnotationForward(annotationId);
    }
    onClose();
  };

  const handleSendToBack = () => {
    if (componentId) {
      sendToBack(componentId);
    }
    if (annotationId) {
      sendAnnotationToBack(annotationId);
    }
    onClose();
  };

  const handleSendBackward = () => {
    if (componentId) {
      sendBackward(componentId);
    }
    if (annotationId) {
      sendAnnotationBackward(annotationId);
    }
    onClose();
  };

  // Adjust position to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 350);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {(componentId || annotationId) ? (
        <>
          {/* Edit actions (copy, duplicate) */}
          {(componentId || annotationId) && (
            <>
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">⌘C</span>
              </button>

              <button
                onClick={handleDuplicate}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Duplicate
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">⌘D</span>
              </button>

              <div className="h-px bg-[var(--color-border)] my-1" />
            </>
          )}

          {/* Layer submenu - available for both components and annotations */}
          <div className="relative group">
            <button className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Layer
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Layer submenu - shows on hover */}
            <div className="absolute left-full top-0 ml-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[160px] hidden group-hover:block">
              <button
                onClick={handleBringToFront}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
              >
                Bring to front
                <span className="text-xs text-[var(--color-text-muted)]">⌘]</span>
              </button>
              <button
                onClick={handleBringForward}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
              >
                Bring forward
                <span className="text-xs text-[var(--color-text-muted)]">]</span>
              </button>
              <button
                onClick={handleSendBackward}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
              >
                Send backward
                <span className="text-xs text-[var(--color-text-muted)]">[</span>
              </button>
              <button
                onClick={handleSendToBack}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
              >
                Send to back
                <span className="text-xs text-[var(--color-text-muted)]">⌘[</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)] my-1" />

          {/* Delete - available for both components and annotations */}
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">⌫</span>
          </button>
        </>
      ) : (
        <>
          {/* No selection - show paste option */}
          <button
            onClick={handlePaste}
            className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Paste
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">⌘V</span>
          </button>
        </>
      )}
    </div>
  );
}
