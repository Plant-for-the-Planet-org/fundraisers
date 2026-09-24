import type { Theme } from './types';

import { splitLocalePrefix } from '@/i18n/localized-paths';
import { DEFAULT_THEME, THEMES } from './themes';

// Maps route path prefixes → theme ID.
// To change a page's theme, edit this map only.
// Longer prefixes take priority (e.g. '/explore/special' overrides '/explore').
// '/' is the fallback for every unmatched path, so the home page gets its own exact-match entry below.
const ROUTE_THEME_MAP: Record<string, string> = {
  '/': 'spring',
  '/explore': 'stratospheric',
  '/login': 'sunset',
  '/fundraisers/create': 'spring',
};

const EXACT_ROUTE_THEME_MAP: Record<string, string> = {
  '/': 'stratospheric',
};

export function getThemeForPath(path: string): Theme {
  // `/de/explore` gets the same theme as `/explore`.
  const { pathname } = splitLocalePrefix(path);
  // Exact match
  const exact = EXACT_ROUTE_THEME_MAP[pathname] ?? ROUTE_THEME_MAP[pathname];
  if (exact) {
    return THEMES[exact] ?? DEFAULT_THEME;
  }
  // Longest prefix match
  const match = Object.keys(ROUTE_THEME_MAP)
    .filter(prefix => prefix !== '/' && pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  const themeId = match ? ROUTE_THEME_MAP[match] : ROUTE_THEME_MAP['/'];
  return THEMES[themeId ?? ''] ?? DEFAULT_THEME;
}
