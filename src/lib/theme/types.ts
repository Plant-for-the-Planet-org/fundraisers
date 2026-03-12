export type AccentColor =
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

export type AnimationType =
  | 'none'
  | 'snow'
  | 'confetti'
  | 'hearts'
  | 'particles';

export type ThemeMode = 'light' | 'dark';

export type ThemeCategory =
  | 'atmospheric'
  | 'celebration'
  | 'nature'
  | 'minimal'
  | 'business'
  | 'system'
  | 'seasonal'
  | 'corporate'
  | 'simple'
  | 'dark';

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  background: string; // Tailwind gradient classes or solid color
  accent: AccentColor; // Tailwind color name (e.g., 'emerald', 'blue')
  mode: ThemeMode; // Defines if theme is light or dark for text/UI colors
  bodyFont: FontId;
  titleFont: FontId;
  animation?: AnimationType;
  logo?: string; // URL for corporate themes
  colorOptions: AccentColor[];
  isPlain?: boolean;
  featured?: boolean; // To make available for selection in the ThemeSettings while creating a fundraiser. Not all themes need to be featured.
}

// The shape stored in fundraiser.settings.theme (raw DB record).
// base_id references a predefined theme from THEMES and serves as the base
// for field-level overrides. Used in Phase 2 (buildTheme).
export interface FundraiserThemeSettings {
  base_id?: string;
  background?: string;
  accent?: string;
  mode?: string;
  body_font?: string;
  title_font?: string;
  animation?: string;
}
