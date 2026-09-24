import { describe, expect, it } from 'vitest';
import { getAccentColor } from './accent-utils';
import {
  getContrastRatio,
  getOnColorText,
  MIN_TEXT_CONTRAST,
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

  it('uses near-black only when white fails, as on bright yellow', () => {
    expect(getOnColorText('#ca8a04')).toBe('#111111');
    // The old green-600: white is 3.3:1 here, so black is the readable choice.
    expect(getOnColorText('#16a34a')).toBe('#111111');
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
