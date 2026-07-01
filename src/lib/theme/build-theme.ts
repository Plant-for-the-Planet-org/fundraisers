import type {
  AccentColor,
  BgSettings,
  FontId,
  FundraiserThemeSettings,
  Theme,
} from './types';

import {
  isValidAnimation,
  isValidDecoration,
  isValidImageMode,
} from './backgrounds';
import { isValidHexColor } from './color-utils';
import { DEFAULT_THEME, THEMES } from './themes';
import { isValidMode } from './validators';

function clampOpacity(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0.05, value));
}

const VALID_ACCENTS = new Set<string>([
  'planet',
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

function buildBg(settings: FundraiserThemeSettings, base: Theme): BgSettings {
  const raw = settings.bg ?? {};

  const gradient =
    typeof raw.gradient === 'string' ? raw.gradient : base.bg.gradient;
  const background_color = isValidHexColor(raw.background_color)
    ? raw.background_color
    : (base.bg.background_color ?? null);
  const pattern_id =
    raw.pattern_id !== undefined ? raw.pattern_id : base.bg.pattern_id;
  const image_url =
    raw.image_url !== undefined ? raw.image_url : base.bg.image_url;
  const image_mode = isValidImageMode(raw.image_mode)
    ? raw.image_mode
    : base.bg.image_mode;
  const logo_id = raw.logo_id !== undefined ? raw.logo_id : base.bg.logo_id;
  const opacity = clampOpacity(raw.opacity, base.bg.opacity);

  // Phase 2 reads bg.animation; Phase 1 records stored animation at the
  // top level (settings.animation). Fall back to the legacy field so
  // existing fundraisers keep their animation after migration.
  const animation = isValidAnimation(raw.animation)
    ? raw.animation
    : isValidAnimation(settings.animation)
      ? settings.animation
      : base.bg.animation;

  // Downgrade decoration to 'none' when the matching asset field is absent —
  // prevents a "pattern" decoration with no pattern_id rendering a blank layer.
  let decoration = isValidDecoration(raw.decoration)
    ? raw.decoration
    : base.bg.decoration;
  if (decoration === 'image' && !image_url) decoration = 'none';
  if (decoration === 'pattern' && !pattern_id) decoration = 'none';
  if (decoration === 'logo' && !logo_id) decoration = 'none';

  return {
    gradient,
    background_color,
    decoration,
    pattern_id,
    image_url,
    image_mode,
    logo_id,
    opacity,
    animation,
  };
}

export function buildTheme(settings?: FundraiserThemeSettings | null): Theme {
  if (!settings) return DEFAULT_THEME;

  const base =
    (settings.base_id ? THEMES[settings.base_id] : undefined) ?? DEFAULT_THEME;

  return {
    ...base,
    id: 'fundraiser-custom',
    name: 'Custom',
    accent: VALID_ACCENTS.has(settings.accent ?? '')
      ? (settings.accent as AccentColor)
      : base.accent,
    mode: isValidMode(settings.mode) ? settings.mode : base.mode,
    bodyFont: VALID_FONTS.has(settings.body_font ?? '')
      ? (settings.body_font as FontId)
      : base.bodyFont,
    titleFont: VALID_FONTS.has(settings.title_font ?? '')
      ? (settings.title_font as FontId)
      : base.titleFont,
    bg: buildBg(settings, base),
  };
}
