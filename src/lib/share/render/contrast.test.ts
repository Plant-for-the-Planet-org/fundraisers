import { describe, expect, it } from 'vitest';
import { getRelativeLuminance } from '@/lib/theme/color-utils';
import {
  accentGraphicOnLight,
  accentTextOnWhite,
  textOnAccent,
} from './contrast';

const onWhite = (hex: string) => 1.05 / (getRelativeLuminance(hex) + 0.05);

describe('button text contrast', () => {
  it('puts dark text on pale or bright accents, as the page does', () => {
    expect(textOnAccent('#f0faf4')).toBe('#111111');
    expect(textOnAccent('#ca8a04')).toBe('#111111');
    expect(textOnAccent('#007a49')).toBe('#ffffff');
  });

  it('darkens a pale accent until it reads on a white button', () => {
    for (const accent of ['#f0faf4', '#fff8e4', '#65a30d', '#007a49']) {
      expect(onWhite(accentTextOnWhite(accent))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps a pastel ring visible on a light background', () => {
    expect(onWhite(accentGraphicOnLight('#f0faf4'))).toBeGreaterThanOrEqual(3);
    // A colour that already stands out is left alone.
    expect(accentGraphicOnLight('#007a49')).toBe('#007a49');
  });
});
