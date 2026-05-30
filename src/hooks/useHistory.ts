import { useState, useCallback, useRef } from 'react';

interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * A history hook using a single state object for atomic updates (no async/microtask scheduling).
 *
 * Batching strategy: we track a "snapshot at the start of an action" via a ref.
 * The first `set` call in each synchronous event handler captures the snapshot and marks
 * the batch as open. Subsequent `set` calls in the same handler update the present without
 * creating new history entries. At the end of the event handler, the snapshot and present
 * have diverged, and a single history entry has been recorded.
 *
 * This avoids the microtask race condition where a pending history push fires *after* an undo.
 */
export function useHistory<T>(initialPresent: T, maxHistoryLength = 50) {
  const [history, setHistory] = useState<History<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  // Ref that tracks the state at the time the *current batch* started.
  // It is null when no batch is open.
  const batchStartRef = useRef<T | null>(null);
  // Whether we are currently inside an undo/redo navigation.
  const isNavigatingRef = useRef(false);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    isNavigatingRef.current = true;
    batchStartRef.current = null;

    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      return {
        past: curr.past.slice(0, curr.past.length - 1),
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });

    // Reset navigation flag after the state update is flushed
    requestAnimationFrame(() => {
      isNavigatingRef.current = false;
    });
  }, []);

  const redo = useCallback(() => {
    isNavigatingRef.current = true;
    batchStartRef.current = null;

    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: curr.future.slice(1),
      };
    });

    requestAnimationFrame(() => {
      isNavigatingRef.current = false;
    });
  }, []);

  const set = useCallback(
    (newPresentOrFn: T | ((prev: T) => T), overwrite = false) => {
      // If we are navigating (undo/redo), ignore any sets triggered by
      // React re-renders or derived effects during the navigation flush.
      if (isNavigatingRef.current) return;

      setHistory((curr) => {
        const resolvedPresent =
          typeof newPresentOrFn === 'function'
            ? (newPresentOrFn as (prev: T) => T)(curr.present)
            : newPresentOrFn;

        if (resolvedPresent === curr.present) return curr;

        // Overwrite mode: just update present, don't touch history
        if (overwrite) {
          return { ...curr, present: resolvedPresent };
        }

        // Determine the snapshot to push to history.
        // If a batch is already open, re-use the snapshot from the start of the batch.
        // Otherwise, the current present is the snapshot.
        const snapshot = batchStartRef.current ?? curr.present;

        // Mark batch as open with the current snapshot
        if (batchStartRef.current === null) {
          batchStartRef.current = curr.present;
          // Schedule batch close for after all synchronous handlers have run
          setTimeout(() => {
            batchStartRef.current = null;
          }, 0);
        }

        const newPast = [...curr.past, snapshot];
        if (newPast.length > maxHistoryLength) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: resolvedPresent,
          future: [],
        };
      });
    },
    [maxHistoryLength]
  );

  const reset = useCallback((newPresent: T) => {
    batchStartRef.current = null;
    isNavigatingRef.current = false;
    setHistory({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    set,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
