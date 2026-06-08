import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { buildAutosaveSnapshot, loadAutosave, saveAutosave } from '../utils/projectStorage';

const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Crash / refresh recovery.
 *
 * On mount it restores the last autosaved design, then persists a rolling
 * snapshot to localStorage a short debounce after every change (and
 * synchronously when the tab is closed/refreshed). This keeps a customer's
 * work safe even if the tab is closed or refreshed by accident — there is no
 * "are you sure" prompt to dismiss, the work simply comes back.
 */
export function useAutosave() {
  const restoredRef = useRef(false);

  // 1. Restore once, before the saver is armed — so we never overwrite a good
  //    snapshot with the empty initial state on first load.
  useEffect(() => {
    if (restoredRef.current) return;

    const saved = loadAutosave();
    if (saved) {
      useStore.getState().loadState(saved);
      // loadState bypasses toggleDarkMode, so sync the document class manually.
      if (saved.canvas?.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    restoredRef.current = true;
  }, []);

  // 2. Debounced persistence on every store change, plus a flush on tab close.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const persist = () => {
      saveAutosave(buildAutosaveSnapshot(useStore.getState()));
    };

    const unsubscribe = useStore.subscribe(() => {
      if (!restoredRef.current) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(persist, AUTOSAVE_DEBOUNCE_MS);
    });

    // Flush the very latest state when the tab is closed/refreshed so the last
    // few edits (within the debounce window) aren't lost.
    const flush = () => persist();
    window.addEventListener('beforeunload', flush);

    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
      window.removeEventListener('beforeunload', flush);
    };
  }, []);
}
