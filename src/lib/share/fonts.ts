import type { FontId } from '@/lib/theme/types';

/** Theme fonts, by the Google Fonts family the server downloads and the CSS variable `next/font` sets in the browser. */
export const SHARE_FONTS: Record<FontId, { family: string; cssVar: string }> = {
  inter: { family: 'Inter', cssVar: '--font-inter-var' },
  'open-sans': { family: 'Open Sans', cssVar: '--font-open-sans-var' },
  poppins: { family: 'Poppins', cssVar: '--font-poppins-var' },
  playfair: { family: 'Playfair Display', cssVar: '--font-playfair-var' },
  roboto: { family: 'Roboto', cssVar: '--font-roboto-var' },
};

/** Weights the share images use: body text, emphasis, titles, and the button. */
export const SHARE_FONT_WEIGHTS = [500, 600, 700, 800] as const;

/**
 * The family name to draw with in the browser.
 * `next/font` renames families (for example `__Poppins_1a2b3c`), and a canvas cannot read a CSS variable, so the name is read from the page.
 */
export function resolveBrowserFontFamily(font: FontId): string {
  const value = getComputedStyle(document.body)
    .getPropertyValue(SHARE_FONTS[font].cssVar)
    .trim();
  // The variable holds a stack; the canvas needs the first family only.
  const first = value
    .split(',')[0]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');
  return first || SHARE_FONTS[font].family;
}
