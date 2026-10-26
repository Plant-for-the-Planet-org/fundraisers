import type { AccentColor } from './types';

import { isValidHexColor } from './color-utils';

// Accents are palette names or hex values. Compare without case: the colour picker returns lowercase hex, while theme presets use uppercase.
export function isSameAccent(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// Readable names for the hex accents in theme presets, so labels and screen readers say "Mint" instead of a hex code. Keys are lowercase.
const HEX_ACCENT_NAMES: Record<string, string> = {
  '#6fcf97': 'Mint',
  '#6c63ff': 'Violet',
  '#c83289': 'Magenta',
  '#2f80ed': 'Blue',
  '#baba67': 'Olive',
  '#eb5757': 'Coral',
  '#42a5ad': 'Teal',
  '#5c4915': 'Brown',
};

// The name to show for an accent: palette names as they are, preset hex accents by name, any other hex as is.
export function getAccentName(accent: string): string {
  return HEX_ACCENT_NAMES[accent.toLowerCase()] ?? accent;
}

// Hex values used to set the --accent-color CSS variable (for non-Tailwind
// consumers, e.g. SVG fills). Accepts a named palette accent OR a raw hex
// (the accent can be seeded from the background colour), and never returns
// undefined so the CSS var always resolves.
export function getAccentColor(accent: string): string {
  if (isValidHexColor(accent)) return accent;
  const map: Record<AccentColor, string> = {
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
  return map[accent as AccentColor] ?? '#15803d';
}
