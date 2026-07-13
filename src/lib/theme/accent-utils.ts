import type { AccentColor } from './types';

import { isValidHexColor } from './color-utils';

export function getAccentClasses(accent: AccentColor) {
  const map: Record<
    AccentColor,
    { button: string; buttonHover: string; icon: string }
  > = {
    planet: {
      button: 'bg-planet-600',
      buttonHover: 'hover:bg-planet-700',
      icon: 'text-planet-500',
    },
    blue: {
      button: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700',
      icon: 'text-blue-500',
    },
    cyan: {
      button: 'bg-cyan-600',
      buttonHover: 'hover:bg-cyan-700',
      icon: 'text-cyan-500',
    },
    emerald: {
      button: 'bg-emerald-600',
      buttonHover: 'hover:bg-emerald-700',
      icon: 'text-emerald-500',
    },
    green: {
      button: 'bg-green-600',
      buttonHover: 'hover:bg-green-700',
      icon: 'text-green-500',
    },
    teal: {
      button: 'bg-teal-600',
      buttonHover: 'hover:bg-teal-700',
      icon: 'text-teal-500',
    },
    lime: {
      button: 'bg-lime-600',
      buttonHover: 'hover:bg-lime-700',
      icon: 'text-lime-500',
    },
    indigo: {
      button: 'bg-indigo-600',
      buttonHover: 'hover:bg-indigo-700',
      icon: 'text-indigo-500',
    },
    purple: {
      button: 'bg-purple-600',
      buttonHover: 'hover:bg-purple-700',
      icon: 'text-purple-500',
    },
    violet: {
      button: 'bg-violet-600',
      buttonHover: 'hover:bg-violet-700',
      icon: 'text-violet-500',
    },
    fuchsia: {
      button: 'bg-fuchsia-600',
      buttonHover: 'hover:bg-fuchsia-700',
      icon: 'text-fuchsia-500',
    },
    pink: {
      button: 'bg-pink-600',
      buttonHover: 'hover:bg-pink-700',
      icon: 'text-pink-500',
    },
    rose: {
      button: 'bg-rose-600',
      buttonHover: 'hover:bg-rose-700',
      icon: 'text-rose-500',
    },
    red: {
      button: 'bg-red-600',
      buttonHover: 'hover:bg-red-700',
      icon: 'text-red-500',
    },
    orange: {
      button: 'bg-orange-600',
      buttonHover: 'hover:bg-orange-700',
      icon: 'text-orange-500',
    },
    amber: {
      button: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-700',
      icon: 'text-amber-500',
    },
    yellow: {
      button: 'bg-yellow-500',
      buttonHover: 'hover:bg-yellow-600',
      icon: 'text-yellow-500',
    },
    slate: {
      button: 'bg-slate-600',
      buttonHover: 'hover:bg-slate-700',
      icon: 'text-slate-500',
    },
    gray: {
      button: 'bg-gray-600',
      buttonHover: 'hover:bg-gray-700',
      icon: 'text-gray-500',
    },
    zinc: {
      button: 'bg-zinc-600',
      buttonHover: 'hover:bg-zinc-700',
      icon: 'text-zinc-500',
    },
    neutral: {
      button: 'bg-neutral-600',
      buttonHover: 'hover:bg-neutral-700',
      icon: 'text-neutral-500',
    },
    stone: {
      button: 'bg-stone-600',
      buttonHover: 'hover:bg-stone-700',
      icon: 'text-stone-500',
    },
  };
  return map[accent];
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
    cyan: '#0891b2',
    emerald: '#059669',
    green: '#16a34a',
    teal: '#0d9488',
    lime: '#65a30d',
    indigo: '#4f46e5',
    purple: '#9333ea',
    violet: '#7c3aed',
    fuchsia: '#c026d3',
    pink: '#db2777',
    rose: '#e11d48',
    red: '#dc2626',
    orange: '#ea580c',
    amber: '#d97706',
    yellow: '#ca8a04',
    slate: '#475569',
    gray: '#4b5563',
    zinc: '#52525b',
    neutral: '#525252',
    stone: '#57534e',
  };
  return map[accent as AccentColor] ?? '#16a34a';
}
