import { describe, expect, it } from 'vitest';
import { getAccentLabel } from '@/lib/theme/accent-utils';
import { THEMES } from '@/lib/theme/themes';
import messages from '../../../../locales/en/fundraisers.json';
import { GRADIENT_OPTIONS, PATTERNS } from './constants';
import { NAMED_PATTERN_IDS, NAMED_THEME_IDS } from './labels';

// A missing key shows the English name from the data, so these tests are what catch a forgotten one.
const theme = messages.Fundraisers.form.theme as Record<
  string,
  Record<string, string> | string
>;
const keysOf = (group: string) => Object.keys(theme[group] as object);

describe('theme editor labels', () => {
  it('names every theme, including the editor’s own Custom theme', () => {
    for (const id of [...Object.keys(THEMES), 'fundraiser-custom']) {
      expect(NAMED_THEME_IDS, id).toContain(id);
    }
    expect(keysOf('themeNames').sort()).toEqual([...NAMED_THEME_IDS].sort());
  });

  it('names every gradient preset by its theme', () => {
    for (const option of GRADIENT_OPTIONS.filter(g => g.value)) {
      expect(NAMED_THEME_IDS, option.id).toContain(option.id);
    }
  });

  it('names every category a theme uses', () => {
    for (const { category } of Object.values(THEMES)) {
      expect(keysOf('themeCategories'), category).toContain(category);
    }
  });

  it('names every pattern in the picker', () => {
    for (const { id } of PATTERNS) {
      expect(NAMED_PATTERN_IDS, id).toContain(id);
    }
    expect(keysOf('patternNames').sort()).toEqual(
      [...NAMED_PATTERN_IDS].sort()
    );
  });

  it('names every accent a theme offers', () => {
    for (const t of Object.values(THEMES)) {
      for (const accent of [t.accent, ...t.colorOptions]) {
        const label = getAccentLabel(accent);
        expect(label, accent).not.toBeNull();
        expect(keysOf('accentNames'), accent).toContain(label?.key);
      }
    }
  });
});
