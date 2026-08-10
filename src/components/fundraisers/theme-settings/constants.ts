import type { LucideIcon } from 'lucide-react';
import type {
  AccentColor,
  AnimationType,
  BgDecoration,
  BgImageMode,
  CustomGradient,
  FontId,
  Theme,
} from '@/lib/theme/types';
import type { FundraiserFormValues } from '../fundraiser-form-schema';

import {
  Building2,
  Heart,
  Image as ImageIcon,
  Minus,
  PartyPopper,
  Snowflake,
  Sparkles,
  SquareDashed,
} from 'lucide-react';
import {
  BG_LIBRARY,
  DEFAULT_GRADIENT_ANGLE,
  LOGO_LIBRARY,
} from '@/lib/theme/backgrounds';
import { THEMES } from '@/lib/theme/themes';

export type BgFormValue = FundraiserFormValues['settings']['theme']['bg'];

export const ACCENT_BG: Record<AccentColor, string> = {
  planet: 'bg-planet-600', // exact Planet Green #007A49
  blue: 'bg-blue-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  lime: 'bg-lime-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  slate: 'bg-slate-500',
  gray: 'bg-gray-500',
  zinc: 'bg-zinc-500',
  neutral: 'bg-neutral-500',
  stone: 'bg-stone-500',
};

export const FONT_OPTIONS: Array<{ id: FontId; family: string }> = [
  { id: 'open-sans', family: '"Open Sans", system-ui, sans-serif' },
  { id: 'poppins', family: 'Poppins, system-ui, sans-serif' },
  { id: 'playfair', family: '"Playfair Display", Georgia, serif' },
  { id: 'inter', family: 'Inter, system-ui, sans-serif' },
  { id: 'roboto', family: 'Roboto, system-ui, sans-serif' },
];

export const ANIMATION_OPTIONS: Array<{
  id: AnimationType;
  icon: LucideIcon;
}> = [
  { id: 'none', icon: Minus },
  { id: 'confetti', icon: PartyPopper },
  { id: 'snow', icon: Snowflake },
  { id: 'hearts', icon: Heart },
  { id: 'fireworks', icon: Sparkles },
];

export const DECORATIONS: Array<{ id: BgDecoration; icon: LucideIcon }> = [
  { id: 'none', icon: Minus },
  { id: 'pattern', icon: SquareDashed },
  { id: 'image', icon: ImageIcon },
  { id: 'logo', icon: Building2 },
];

export const IMAGE_MODES: BgImageMode[] = ['cover', 'repeat'];

export const THEME_LIST: Theme[] = Object.values(THEMES);
export const FEATURED_THEMES = THEME_LIST.filter(t => t.featured);

export type GradientOption = {
  id: string;
  value: string;
  label: string;
  mode: 'light' | 'dark';
};
// 1 "None" + 7 preset gradients. All classes come from themes.ts so Tailwind's
// scanner already includes them in the bundle. Labels are English-only (theme
// names + "None") — not translated.
export const GRADIENT_OPTIONS: GradientOption[] = [
  { id: 'none', value: '', label: 'None', mode: 'light' },
  ...[
    'spring',
    'birthday',
    'wedding',
    'stratospheric',
    'sunset',
    'dark-ocean',
    'lush-forest',
  ]
    .map(id => THEMES[id])
    .filter((t): t is Theme => Boolean(t))
    .map(t => ({
      id: t.id,
      value: t.bg.gradient,
      label: t.name,
      mode: t.mode,
    })),
];

// Only these curated assets show in the picker for now. The rest stay in
// BG_LIBRARY as resources (still resolvable for saved themes) but are hidden.
const PICKABLE_BG_IDS = new Set([
  'bg-dots',
  'bg-grid-lines',
  'bg-trees',
  'bg-woodgrain',
  'bg-forest',
  'bg-forest-bw',
  'bg-academy',
  'bg-academy-bw',
  'bg-planet-botanical',
  'bg-planet-light',
  'bg-planet-dark',
]);

export const PATTERNS = BG_LIBRARY.filter(
  b => b.type === 'pattern' && PICKABLE_BG_IDS.has(b.id)
);
export const IMAGES = BG_LIBRARY.filter(
  b => b.type !== 'pattern' && PICKABLE_BG_IDS.has(b.id)
);
export const LOGOS = LOGO_LIBRARY;

// Quick-pick swatches shown beneath the picker, from the Planet CI palette
// (branding in planet-skills). Five hue columns; the grid is 5-wide so the top
// row reads as the light "Soft" background wash and the bottom row as the
// deeper brand variant of the same hue.
export const QUICK_PICK_COLORS = [
  // Top row — light "Soft" backgrounds
  '#f0faf4', // Soft Green
  '#eff6ff', // Soft Blue
  '#f9f1ff', // Soft Purple
  '#fff3f3', // Soft Red
  '#fff8e4', // Soft Yellow
  // Bottom row — medium tints of the same brand hues (~50% mix on white), so
  // they read as a stronger wash but still work as a background with dark text.
  '#93d6af', // Leaf Green
  '#97bff6', // Ocean Blue
  '#b5b1ff', // Purple Sky
  '#f5abab', // Fire Red
  '#f9dda2', // Golden Yellow
];

export const DEFAULT_SOLID_COLOR = '#ffffff';

export function defaultCustomGradient(accentColor: string): CustomGradient {
  return {
    angle: DEFAULT_GRADIENT_ANGLE,
    stops: [
      { color: accentColor, position: 0 },
      { color: '#ffffff', position: 100 },
    ],
  };
}

export { pickRandom } from '@/components/theme/animations/base';
