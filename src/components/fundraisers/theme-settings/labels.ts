import type { BackgroundAsset } from '@/lib/theme/backgrounds';
import type { ThemeCategory } from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { getAccentLabel } from '@/lib/theme/accent-utils';

// Themes and patterns with a name in the locale files. Anything else shows its English name from the data.
export const NAMED_THEME_IDS = [
  'spring',
  'birthday',
  'wedding',
  'baby-shower',
  'sports',
  'stratospheric',
  'explore',
  'sunset',
  'dark-ocean',
  'lush-forest',
  'volcanic',
  'midnight',
  'planet',
  'dark',
  'minimal',
  'dashboard',
  'default',
  // buildTheme's id for a fundraiser's own theme.
  'fundraiser-custom',
] as const;

export const NAMED_PATTERN_IDS = [
  'bg-dots',
  'bg-grid-lines',
  'bg-trees',
  'bg-woodgrain',
  'bg-leafy',
  'bg-spring',
  'bg-baby-shower',
  'bg-sports',
] as const;

type NamedThemeId = (typeof NAMED_THEME_IDS)[number];
type NamedPatternId = (typeof NAMED_PATTERN_IDS)[number];

const isNamedTheme = (id: string): id is NamedThemeId =>
  (NAMED_THEME_IDS as readonly string[]).includes(id);
const isNamedPattern = (id: string): id is NamedPatternId =>
  (NAMED_PATTERN_IDS as readonly string[]).includes(id);

// Labels for the theme editor, translated by id.
// A language without the key yet (until Lingohub adds it) shows the English name from the data, not the key path.
export function useThemeLabels() {
  const t = useTranslations('Fundraisers.form.theme');

  const themeName = (theme: { id: string; name: string }) => {
    if (!isNamedTheme(theme.id)) return theme.name;
    const key = `themeNames.${theme.id}` as const;
    return t.has(key) ? t(key) : theme.name;
  };

  const categoryName = (category: ThemeCategory) => {
    const key = `themeCategories.${category}` as const;
    return t.has(key) ? t(key) : category;
  };

  // Patterns get a translated name; images keep their label.
  const decorationName = (asset: Pick<BackgroundAsset, 'id' | 'label'>) => {
    if (!isNamedPattern(asset.id)) return asset.label;
    const key = `patternNames.${asset.id}` as const;
    return t.has(key) ? t(key) : asset.label;
  };

  // Any other hex (picked with the custom colour picker) has no name, so it shows as the hex.
  const accentName = (accent: string) => {
    const label = getAccentLabel(accent);
    if (!label) return accent;
    const key = `accentNames.${label.key}` as const;
    return t.has(key) ? t(key) : label.fallback;
  };

  return { themeName, categoryName, decorationName, accentName };
}
