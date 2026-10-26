import type { Theme } from './types';

import { DEFAULT_THEME, THEMES } from './themes';

// Maps route path prefixes → theme ID.
// To change a page's theme, edit this map only.
// Longer prefixes take priority (e.g. '/explore/special' overrides '/explore').
// '/' matches the home page only; any path that matches nothing gets DEFAULT_THEME.
const ROUTE_THEME_MAP: Record<string, string> = {
  '/': 'stratospheric',
  '/explore': 'explore',
  '/login': 'sunset',
  '/fundraisers/create': 'spring',
  '/dashboard': 'dashboard',
  // The editor previews the fundraiser's own theme; this is only what shows before that loads.
  '/dashboard/fundraisers/edit': 'default',
};

export function getThemeForPath(pathname: string): Theme {
  // Exact match
  const exact = ROUTE_THEME_MAP[pathname];
  if (exact) {
    return THEMES[exact] ?? DEFAULT_THEME;
  }
  // Longest prefix match. '/' is left out, or it would match every path.
  const match = Object.keys(ROUTE_THEME_MAP)
    .filter(prefix => prefix !== '/' && pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  if (!match) {
    return DEFAULT_THEME;
  }
  return THEMES[ROUTE_THEME_MAP[match]] ?? DEFAULT_THEME;
}
