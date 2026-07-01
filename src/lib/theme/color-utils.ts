import type { ThemeMode } from './types';

/**
 * Strict 6-digit hex guard (e.g. `#1a2b3c`). Used by the form schema, buildBg,
 * and ThemeShell before injecting the colour as an inline style — mirroring the
 * safeCssUrl guard, so a malformed value can never reach the DOM.
 */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// Above this luminance a colour reads better with dark text (light mode);
// below it, with light text (dark mode). 0.179 is the WCAG cross-over point
// between black-on-colour and white-on-colour contrast.
const LIGHT_MODE_LUMINANCE_THRESHOLD = 0.179;

/** Picks the theme mode whose text colour stays readable on `hex`. */
export function getReadableMode(hex: string): ThemeMode {
  return getRelativeLuminance(hex) > LIGHT_MODE_LUMINANCE_THRESHOLD
    ? 'light'
    : 'dark';
}
