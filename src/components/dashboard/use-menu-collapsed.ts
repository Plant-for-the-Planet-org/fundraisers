'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'dashboard-menu-collapsed';
const listeners = new Set<() => void>();
/** Collapsed by default: three items with clear icons, and the content gets the room. */
const DEFAULT_COLLAPSED = true;

// Used when storage is blocked (private mode), so the toggle still works for this visit.
let memoryValue = DEFAULT_COLLAPSED;

function read(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? memoryValue : stored === 'true';
  } catch {
    return memoryValue;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether the dashboard menu is collapsed to icons. Remembered per browser; the server renders the default. */
export function useMenuCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribe,
    read,
    () => DEFAULT_COLLAPSED
  );

  const toggle = useCallback(() => {
    memoryValue = !read();
    try {
      window.localStorage.setItem(STORAGE_KEY, String(memoryValue));
    } catch {
      // Blocked storage: memoryValue carries the state until the page reloads.
    }
    listeners.forEach(listener => listener());
  }, []);

  return [collapsed, toggle];
}
