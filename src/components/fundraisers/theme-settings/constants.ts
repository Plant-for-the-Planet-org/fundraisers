import type { LucideIcon } from 'lucide-react';
import type {
  AccentColor,
  AnimationType,
  BgDecoration,
  BgImageMode,
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
import { BG_LIBRARY, LOGO_LIBRARY } from '@/lib/theme/backgrounds';
import { THEMES } from '@/lib/theme/themes';

export type BgFormValue = FundraiserFormValues['settings']['theme']['bg'];

export const ACCENT_BG: Record<AccentColor, string> = {
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
// scanner already includes them in the bundle.
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

export const PATTERNS = BG_LIBRARY.filter(b => b.type === 'pattern');
export const IMAGES = BG_LIBRARY.filter(b => b.type !== 'pattern');
export const LOGOS = LOGO_LIBRARY;

export const pickRandom = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)] as T;
