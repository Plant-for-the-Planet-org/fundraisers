'use client';

import { useCallback, useEffect, useState } from 'react';

// Per-user pinned apps, stored client-side. Keyed by Auth0 `sub` so two accounts
// on one device keep separate favourites. v0 has no backend; a later version can
// sync these to Auth0 user_metadata or a prefs endpoint for cross-device.

const key = (sub: string) => `fc:apps:favorites:${sub}`;

export function useFavorites(sub: string | undefined) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    let next: string[] = [];
    if (sub) {
      try {
        const raw = localStorage.getItem(key(sub));
        next = raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        next = [];
      }
    }
    // Sync favourites from localStorage after mount: server renders [] and the
    // client adopts the stored list, so SSR markup stays stable (no hydration
    // mismatch). Reading client-only storage is exactly what an effect is for,
    // hence the rule is suppressed here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(next);
  }, [sub]);

  const toggle = useCallback(
    (id: string) => {
      if (!sub) return;
      setFavorites(prev => {
        const next = prev.includes(id)
          ? prev.filter(x => x !== id)
          : [...prev, id];
        try {
          localStorage.setItem(key(sub), JSON.stringify(next));
        } catch {
          // ignore quota / unavailable storage
        }
        return next;
      });
    },
    [sub]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
