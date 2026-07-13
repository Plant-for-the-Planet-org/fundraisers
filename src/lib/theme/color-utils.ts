import type { CSSProperties } from 'react';
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

function luminanceToMode(luminance: number): ThemeMode {
  return luminance > LIGHT_MODE_LUMINANCE_THRESHOLD ? 'light' : 'dark';
}

/** Picks the theme mode whose text colour stays readable on `hex`. */
export function getReadableMode(hex: string): ThemeMode {
  return luminanceToMode(getRelativeLuminance(hex));
}

/** Readable mode for a gradient: the average luminance across its stops. */
export function getReadableModeForStops(colors: string[]): ThemeMode {
  const avg =
    colors.reduce((sum, c) => sum + getRelativeLuminance(c), 0) / colors.length;
  return luminanceToMode(avg);
}

/** The gradient stop colour nearest position 50 — the visually dominant one. */
export function getDominantStopColor(
  stops: { color: string; position: number }[]
): string | null {
  if (stops.length === 0) return null;
  return stops.reduce((best, s) =>
    Math.abs(s.position - 50) < Math.abs(best.position - 50) ? s : best
  ).color;
}

/**
 * Foreground/icon class that stays legible on top of a solid or gradient swatch.
 * `solid` takes priority; otherwise the gradient `stops` are averaged. Returns
 * `text-muted-foreground` (and `mode: null`) when there is no colour to read on.
 */
export function getSwatchContrast(
  solid: string | null,
  stops?: string[] | null
): { iconClass: string; mode: ThemeMode | null } {
  const mode = solid
    ? getReadableMode(solid)
    : stops && stops.length > 0
      ? getReadableModeForStops(stops)
      : null;
  return {
    mode,
    iconClass:
      mode === 'dark'
        ? 'text-white'
        : mode === 'light'
          ? 'text-zinc-900'
          : 'text-muted-foreground',
  };
}

/**
 * Selected-swatch marker: the live theme accent as border + a soft halo ring,
 * so selection reads clearly on any swatch colour.
 */
export const swatchSelectedStyle: CSSProperties = {
  borderColor: 'var(--accent-color)',
  boxShadow:
    '0 0 0 2px color-mix(in srgb, var(--accent-color) 30%, transparent)',
};
