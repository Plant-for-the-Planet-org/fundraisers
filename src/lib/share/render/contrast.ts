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

/** Accent text on a dark `background`: the accent, lightened no more than needed to read at 4.5:1. */
export function accentTextOnDark(accent: string, background: string): string {
  for (let amount = 0; amount <= 0.9; amount += 0.05) {
    const colour = mixHex(accent, '#ffffff', amount);
    if (contrastRatio(colour, background) >= 4.5) return colour;
  }
  return '#ffffff';
}

/** The WCAG contrast between two colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const x = getRelativeLuminance(a);
  const y = getRelativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** The pill behind the donor's gift on a dark background: a light tint of it. Opaque, so the text keeps its contrast over any theme image. */
export function pillOnDark(background: string): string {
  return mixHex(background, '#ffffff', 0.12);
}

/** The gift pill on a light palette: a soft tint of the accent, and the accent darkened until it reads on the pill at 4.5:1. */
export function giftPillOnLight(accent: string): {
  fill: string;
  text: string;
} {
  const fill = mixHex(accent, '#ffffff', 0.7);
  for (let amount = 0.35; amount <= 0.9; amount += 0.05) {
    const text = mixHex(accent, '#000000', amount);
    if (contrastRatio(text, fill) >= 4.5) return { fill, text };
  }
  return { fill, text: '#111111' };
}

/** The gift pill on a dark palette: a light tint of the background, and the accent lightened until it reads on the pill at 4.5:1. */
export function giftPillOnDark(
  accent: string,
  background: string
): { fill: string; text: string } {
  const fill = pillOnDark(background);
  return { fill, text: accentTextOnDark(accent, fill) };
}

/** A ring, tip or sparkle on a light background: 3:1, the bar for graphics, so a pastel accent still shows. */
export function accentGraphicOnLight(accent: string): string {
  return accentOnWhite(accent, 3);
}
