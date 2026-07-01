export type AccentColor =
  | 'planet' // Plant-for-the-Planet brand green (#007A49), registered in globals.css @theme
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'green'
  | 'teal'
  | 'lime'
  | 'indigo'
  | 'purple'
  | 'violet'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone';

export type FontId = 'open-sans' | 'inter' | 'poppins' | 'playfair' | 'roboto';

export const ANIMATION_TYPES = [
  'none',
  'snow',
  'confetti',
  'hearts',
  'fireworks',
] as const;
export type AnimationType = (typeof ANIMATION_TYPES)[number];

export type ThemeMode = 'light' | 'dark';

export type ThemeCategory =
  | 'atmospheric'
  | 'celebration'
  | 'nature'
  | 'minimal'
  | 'business'
  | 'system'
  | 'seasonal'
  | 'simple'
  | 'dark';

export const BG_DECORATIONS = ['none', 'pattern', 'image', 'logo'] as const;
export type BgDecoration = (typeof BG_DECORATIONS)[number];

export const BG_IMAGE_MODES = ['cover', 'repeat'] as const;
export type BgImageMode = (typeof BG_IMAGE_MODES)[number];

export interface BgSettings {
  gradient: string; // tailwind class string, '' = no gradient layer
  background_color: string | null; // '#RRGGBB' solid wash, null = none; mutually exclusive with gradient
  decoration: BgDecoration;
  pattern_id: string | null;
  image_url: string | null; // library key OR https URL
  image_mode: BgImageMode;
  logo_id: string | null; // library key for partner logo decoration
  opacity: number; // applies to pattern + image layers, 0.05–1
  animation: AnimationType; // overlay animation (snow, confetti, hearts, fireworks)
}

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  accent: AccentColor;
  mode: ThemeMode;
  bodyFont: FontId;
  titleFont: FontId;
  logo?: string; // URL for corporate themes
  colorOptions: AccentColor[];
  isPlain?: boolean;
  featured?: boolean; // Visible in the ThemeBrowseGrid customize picker.
  curatedBgs?: string[]; // Background library keys suggested in the picker.
  bg: BgSettings; // Full background config: gradient + decoration + opacity.
}

// The shape stored in fundraiser.settings.theme (raw DB record).
// base_id references a predefined theme from THEMES and serves as the base
// for field-level overrides. Used in Phase 2 (buildTheme). Field types are
// intentionally loose since raw DB data may not match enum constraints —
// buildTheme/buildBg validate and coerce them.
export interface FundraiserThemeSettings {
  base_id?: string;
  accent?: string;
  mode?: string;
  body_font?: string;
  title_font?: string;
  /** @deprecated Phase 1 field — moved to bg.animation in Phase 2. Read by buildBg/fundraiserToFormValues for back-compat migration. */
  animation?: string;
  bg?: {
    gradient?: string;
    background_color?: string | null;
    decoration?: string;
    pattern_id?: string | null;
    image_url?: string | null;
    image_mode?: string;
    logo_id?: string | null;
    opacity?: number;
    animation?: string;
  };
}
