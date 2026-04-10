import type { Theme } from './types';

import { DEFAULT_THEME,THEMES } from './themes';

// Maps route path prefixes → theme ID.
// To change a page's theme, edit this map only.
// Longer prefixes take priority (e.g. '/explore/special' overrides '/explore').
const ROUTE_THEME_MAP: Record<string, string> = {
  '/': 'spring',
  '/explore': 'stratospheric',
  '/login': 'sunset',
  '/fundraisers/create': 'spring',
};

export function getThemeForPath(pathname: string): Theme {
  // Exact match
  if (ROUTE_THEME_MAP[pathname]) {
    return THEMES[ROUTE_THEME_MAP[pathname]] ?? DEFAULT_THEME;
  }
  // Longest prefix match
  const match = Object.keys(ROUTE_THEME_MAP)
    .filter(prefix => prefix !== '/' && pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  const themeId = match ? ROUTE_THEME_MAP[match] : ROUTE_THEME_MAP['/'];
  return THEMES[themeId ?? ''] ?? DEFAULT_THEME;
}
