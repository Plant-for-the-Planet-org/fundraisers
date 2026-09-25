import { getReadableMode, getRelativeLuminance } from '@/lib/theme/color-utils';
import { mixHex } from './primitives';

/** Text on the accent: dark or white, whichever the page's own buttons use (ThemeShell picks by luminance). */
export function textOnAccent(accent: string): string {
  return getReadableMode(accent) === 'light' ? '#111111' : '#ffffff';
}

/** The accent, darkened no more than needed to reach `ratio` against white. */
export function accentOnWhite(
  accent: string,
  ratio: number,
  minDarken = 0
): string {
  for (let amount = minDarken; amount <= 0.9; amount += 0.05) {
    const colour = mixHex(accent, '#000000', amount);
    if (1.05 / (getRelativeLuminance(colour) + 0.05) >= ratio) return colour;
  }
  return '#111111';
}

/** Text on a white button: the accent, darkened until it reads at 4.5:1. */
export function accentTextOnWhite(accent: string): string {
  return accentOnWhite(accent, 4.5, 0.35);
}

/** A ring, tip or sparkle on a light background: 3:1, the bar for graphics, so a pastel accent still shows. */
export function accentGraphicOnLight(accent: string): string {
  return accentOnWhite(accent, 3);
}
