import { describe, expect, it } from 'vitest';
import { getAccentName, isSameAccent } from './accent-utils';
import { THEMES } from './themes';

describe('isSameAccent', () => {
  it('treats a hex accent as the same colour in any case', () => {
    // The colour picker returns lowercase; theme presets use uppercase.
    expect(isSameAccent('#6FCF97', '#6fcf97')).toBe(true);
  });

  it('matches palette names and tells different accents apart', () => {
    expect(isSameAccent('emerald', 'emerald')).toBe(true);
    expect(isSameAccent('#6FCF97', '#6FCF98')).toBe(false);
    expect(isSameAccent('emerald', '#047857')).toBe(false);
  });
});

describe('getAccentName', () => {
  it('names every hex accent offered by a theme preset', () => {
    // A hex here would be read out as a code by screen readers.
    const hexAccents = Object.values(THEMES).flatMap(theme =>
      [theme.accent, ...theme.colorOptions].filter(a => a.startsWith('#'))
    );
    expect(hexAccents.length).toBeGreaterThan(0);
    for (const hex of hexAccents)
      expect(getAccentName(hex), hex).not.toMatch(/^#/);
  });

  it('finds the name in any case and keeps other accents as they are', () => {
    expect(getAccentName('#6fcf97')).toBe('Mint');
    expect(getAccentName('emerald')).toBe('emerald');
    expect(getAccentName('#123456')).toBe('#123456');
  });
});
