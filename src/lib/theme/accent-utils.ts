import type { AccentColor } from './types';

import { isValidHexColor } from './color-utils';

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
    amber: '#d97706',
    yellow: '#ca8a04',
    slate: '#475569',
    gray: '#4b5563',
    zinc: '#52525b',
    neutral: '#525252',
    stone: '#57534e',
  };
  return map[accent as AccentColor] ?? '#15803d';
}
