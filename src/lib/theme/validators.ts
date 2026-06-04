import type { ThemeMode } from './types';

// TODO: migrate isValidDecoration, isValidImageMode, isValidAnimation from
// backgrounds.ts and VALID_ACCENTS, VALID_FONTS, VALID_MODES from build-theme.ts
// into this file so all theme validators live in one place.

export function isValidMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}
