'use client';

import { useEffect, useState } from 'react';

/**
 * Reactive boolean: `true` when the `dark` class is present on
 * `<html>` (the source of truth set by `ThemeShell`). Updates via
 * `MutationObserver` so callers re-render when the theme toggles.
 *
 * Safe during SSR — initial value is `false` on the server.
 */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
