import { describe, expect, it } from 'vitest';
import { getRelativeLuminance } from '@/lib/theme/color-utils';
import {
  accentGraphicOnLight,
  accentTextOnDark,
  accentTextOnWhite,
  contrastRatio,
  giftPillOnDark,
  giftPillOnLight,
  textOnAccent,
} from './contrast';
import { mixHex } from './primitives';
import { SEASONS } from './seasons';

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

  it('lightens a deep accent until it reads on a dark background', () => {
    for (const accent of ['#007a49', '#1e1b4b', '#65a30d', '#facc15']) {
      // The dark palette's background.
      const bg = mixHex(accent, '#050505', 0.72);
      expect(
        contrastRatio(accentTextOnDark(accent, bg), bg)
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps a pastel ring visible on a light background', () => {
    expect(onWhite(accentGraphicOnLight('#f0faf4'))).toBeGreaterThanOrEqual(3);
    // A colour that already stands out is left alone.
    expect(accentGraphicOnLight('#007a49')).toBe('#007a49');
  });
});

describe('gift pill contrast', () => {
  const accents = [
    '#007a49',
    '#1e1b4b',
    '#65a30d',
    '#facc15',
    '#f0faf4',
    '#e11d48',
    '#ffffff',
    '#000000',
  ];

  it('reads at 4.5:1 on a light palette, in a tint that shows on the pale background', () => {
    for (const accent of accents) {
      const { fill, text } = giftPillOnLight(accent);
      expect(contrastRatio(text, fill), accent).toBeGreaterThanOrEqual(4.5);
      // The light palette's background.
      const bg = mixHex(accent, '#ffffff', 0.9);
      if (accent !== '#ffffff')
        expect(getRelativeLuminance(fill), accent).toBeLessThan(
          getRelativeLuminance(bg)
        );
    }
  });

  it('reads at 4.5:1 on a dark palette, in a tint lighter than the background', () => {
    for (const accent of accents) {
      // The dark palette's background.
      const bg = mixHex(accent, '#050505', 0.72);
      const { fill, text } = giftPillOnDark(accent, bg);
      expect(contrastRatio(text, fill), accent).toBeGreaterThanOrEqual(4.5);
      expect(getRelativeLuminance(fill), accent).toBeGreaterThan(
        getRelativeLuminance(bg)
      );
    }
  });

  it('reads at 4.5:1 in the Christmas and Halloween palettes', () => {
    for (const season of [SEASONS.christmas, SEASONS.halloween]) {
      const P = season.palette!();
      expect(contrastRatio(P.accentText, P.giftPill)).toBeGreaterThanOrEqual(
        4.5
      );
    }
  });
});
