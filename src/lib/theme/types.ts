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
  | 'minimal'
  | 'celebration'
  | 'nature'
  | 'business'
  | 'atmospheric';

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  background: string;
  accent: AccentColor;
  mode: ThemeMode;
  bodyFont: FontId;
  titleFont: FontId;
  animation: AnimationType;
  colorOptions: AccentColor[];
  isPlain?: boolean;
  featured?: boolean;
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
