'use client';

import { useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query and re-render on changes.
 *
 * SSR-safe via `useSyncExternalStore`: the server snapshot is always `false`,
 * so the first client paint matches the server, then reconciles to the real
 * match on hydration. Use for rendering one of two structurally different
 * layouts (not for cosmetic tweaks — prefer Tailwind responsive classes there).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
