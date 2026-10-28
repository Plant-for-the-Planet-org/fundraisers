import type { AccentColor } from './types';

import { isValidHexColor } from './color-utils';

// Accents are palette names or hex values. Compare without case: the colour picker returns lowercase hex, while theme presets use uppercase.
export function isSameAccent(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// The palette accents' hex values.
const ACCENT_HEX: Record<AccentColor, string> = {
  planet: '#007a49',
  blue: '#2563eb',
  cyan: '#0e7490',
  emerald: '#047857',
  green: '#15803d',
  teal: '#0f766e',
  lime: '#65a30d',
  indigo: '#4f46e5',
  purple: '#9333ea',
  violet: '#7c3aed',
  fuchsia: '#c026d3',
  pink: '#db2777',
  rose: '#e11d48',
  red: '#dc2626',
  orange: '#c2410c',
  // amber-700, not amber-600: dark enough that button text on it is white (5.0:1).
  amber: '#b45309',
  yellow: '#ca8a04',
  slate: '#475569',
  gray: '#4b5563',
  zinc: '#52525b',
  neutral: '#525252',
  stone: '#57534e',
};

// Names for the hex accents in theme presets, so labels and screen readers say "Bright Green" instead of a hex code.
// Each has its own key, apart from the palette names. The English name is the fallback until a language has the key. Hex values are lowercase.
const HEX_ACCENT_NAMES = {
  '#6fcf97': { key: 'brightGreen', name: 'Bright Green' },
  '#6c63ff': { key: 'purpleSky', name: 'Purple Sky' },
  '#c83289': { key: 'berryPink', name: 'Berry Pink' },
  '#2f80ed': { key: 'oceanBlue', name: 'Ocean Blue' },
  '#baba67': { key: 'oliveGrove', name: 'Olive Grove' },
  '#eb5757': { key: 'fireRed', name: 'Fire Red' },
  '#42a5ad': { key: 'lagoonTeal', name: 'Lagoon Teal' },
  '#5c4915': { key: 'earthBrown', name: 'Earth Brown' },
} as const satisfies Record<string, { key: string; name: string }>;

export type AccentNameKey =
  | AccentColor
  | (typeof HEX_ACCENT_NAMES)[keyof typeof HEX_ACCENT_NAMES]['key'];

// An accent's name key in the locale files and its English fallback.
// Palette names are their own key; preset hex accents use their name; any other hex has none.
export function getAccentLabel(
  accent: string
): { key: AccentNameKey; fallback: string } | null {
  if (Object.hasOwn(ACCENT_HEX, accent)) {
    return {
      key: accent as AccentColor,
      fallback: accent.charAt(0).toUpperCase() + accent.slice(1),
    };
  }
  const hex = accent.toLowerCase();
  if (!Object.hasOwn(HEX_ACCENT_NAMES, hex)) return null;
  const { key, name } = HEX_ACCENT_NAMES[hex as keyof typeof HEX_ACCENT_NAMES];
  return { key, fallback: name };
}

// Hex values used to set the --accent-color CSS variable (for non-Tailwind
// consumers, e.g. SVG fills). Accepts a named palette accent OR a raw hex
// (the accent can be seeded from the background colour), and never returns
// undefined so the CSS var always resolves.
export function getAccentColor(accent: string): string {
  if (isValidHexColor(accent)) return accent;
  return ACCENT_HEX[accent as AccentColor] ?? '#15803d';
}
