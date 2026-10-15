import { describe, expect, it } from 'vitest';
import { getAccentColor } from './accent-utils';
import {
  getContrastRatio,
  getOnColorText,
  getReadableInk,
  MIN_TEXT_CONTRAST,
  mixHex,
} from './color-utils';
import { THEMES } from './themes';

describe('getContrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(getContrastRatio('#15803d', '#15803d')).toBe(1);
  });

  it('does not depend on argument order', () => {
    expect(getContrastRatio('#ffffff', '#007a49')).toBe(
      getContrastRatio('#007a49', '#ffffff')
    );
  });
});

describe('getOnColorText', () => {
  it('prefers white on mid-dark colours', () => {
    expect(getOnColorText('#007a49')).toBe('#ffffff');
    expect(getOnColorText('#15803d')).toBe('#ffffff');
  });

  it('uses black only when white fails, as on bright yellow', () => {
    expect(getOnColorText('#ca8a04')).toBe('#000000');
    // The old green-600: white is 3.3:1 here, so black is the readable choice.
    expect(getOnColorText('#16a34a')).toBe('#000000');
  });

  it('keeps custom hex accents at AA contrast for button text', () => {
    // #ee0033 sits in the band where white and #111111 both fail AA.
    const hexes = ['#ee0033'];
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    for (let r = 0; r < 256; r += 8)
      for (let g = 0; g < 256; g += 8)
        for (let b = 0; b < 256; b += 8)
          hexes.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    const failing = hexes.filter(
      hex => getContrastRatio(hex, getOnColorText(hex)) < MIN_TEXT_CONTRAST
    );
    expect(failing).toEqual([]);
  });

  it('keeps every palette accent at AA contrast for button text', () => {
    const accents = new Set(
      Object.values(THEMES).flatMap(theme => [
        theme.accent,
        ...(theme.colorOptions ?? []),
      ])
    );
    for (const accent of accents) {
      const hex = getAccentColor(accent);
      expect(
        getContrastRatio(hex, getOnColorText(hex)),
        `${accent} ${hex}`
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });
});

describe('getReadableInk', () => {
  const tint = (accent: string, base: string) => mixHex(accent, base, 0.2);

  it('keeps an accent that already reads on the base', () => {
    expect(getReadableInk('#007a49', '#ffffff')).toBe('#007a49');
  });

  it('darkens a light accent on its light tint until it passes', () => {
    for (const accent of ['#b45309', '#ca8a04', '#f5abab', '#ffffff']) {
      const base = tint(accent, '#ffffff');
      expect(
        getContrastRatio(getReadableInk(accent, base), base)
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });

  it('lightens a dark accent on its dark tint until it passes', () => {
    for (const accent of ['#047857', '#4f46e5', '#000000']) {
      const base = tint(accent, '#000000');
      expect(
        getContrastRatio(getReadableInk(accent, base), base)
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });
});
