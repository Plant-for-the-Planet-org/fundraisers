import type {
  AccentColor,
  AnimationType,
  FontId,
  FundraiserThemeSettings,
  Theme,
  ThemeMode,
} from './types';

import { DEFAULT_THEME, THEMES } from './themes';

const VALID_ACCENTS = new Set<string>([
  'blue',
  'cyan',
  'emerald',
  'green',
  'teal',
  'lime',
  'indigo',
  'purple',
  'violet',
  'fuchsia',
  'pink',
  'rose',
  'red',
  'orange',
  'amber',
  'yellow',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
]);
const VALID_FONTS = new Set([
  'open-sans',
  'inter',
  'poppins',
  'playfair',
  'roboto',
]);
const VALID_MODES = new Set(['light', 'dark']);
const VALID_ANIMS = new Set([
  'none',
  'snow',
  'confetti',
  'hearts',
  'particles',
]);

export function buildTheme(settings?: FundraiserThemeSettings | null): Theme {
  if (!settings) return DEFAULT_THEME;

  const base =
    (settings.base_id ? THEMES[settings.base_id] : undefined) ?? DEFAULT_THEME;

  return {
    ...base,
    background: settings.background ?? base.background,
    accent: VALID_ACCENTS.has(settings.accent ?? '')
      ? (settings.accent as AccentColor)
      : base.accent,
    mode: VALID_MODES.has(settings.mode ?? '')
      ? (settings.mode as ThemeMode)
      : base.mode,
    bodyFont: VALID_FONTS.has(settings.body_font ?? '')
      ? (settings.body_font as FontId)
      : base.bodyFont,
    titleFont: VALID_FONTS.has(settings.title_font ?? '')
      ? (settings.title_font as FontId)
      : base.titleFont,
    animation: VALID_ANIMS.has(settings.animation ?? '')
      ? (settings.animation as AnimationType)
      : base.animation,
  };
}
