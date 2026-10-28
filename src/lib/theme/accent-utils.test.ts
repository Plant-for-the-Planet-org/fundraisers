import { describe, expect, it } from 'vitest';
import { getAccentLabel, isSameAccent } from './accent-utils';
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

describe('getAccentLabel', () => {
  it('names every hex accent offered by a theme preset', () => {
    // A hex without a name would be read out as a code by screen readers.
    const hexAccents = Object.values(THEMES).flatMap(theme =>
      [theme.accent, ...theme.colorOptions].filter(a => a.startsWith('#'))
    );
    expect(hexAccents.length).toBeGreaterThan(0);
    for (const hex of hexAccents)
      expect(getAccentLabel(hex), hex).not.toBeNull();
  });

  it('gives different colours different names', () => {
    const palette = Object.values(THEMES)
      .flatMap(t => [t.accent, ...t.colorOptions])
      .filter(a => !a.startsWith('#'));
    const hexKeys = Object.values(THEMES)
      .flatMap(t => [t.accent, ...t.colorOptions])
      .filter(a => a.startsWith('#'))
      .map(a => getAccentLabel(a)?.key);
    for (const key of hexKeys) expect(palette, key).not.toContain(key);
  });

  it('finds the name in any case, and has none for other hex', () => {
    expect(getAccentLabel('#6fcf97')).toEqual({
      key: 'brightGreen',
      fallback: 'Bright Green',
    });
    expect(getAccentLabel('#6FCF97')?.key).toBe('brightGreen');
    expect(getAccentLabel('emerald')).toEqual({
      key: 'emerald',
      fallback: 'Emerald',
    });
    expect(getAccentLabel('#123456')).toBeNull();
  });
});
