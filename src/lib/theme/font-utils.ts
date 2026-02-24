import type { FontId } from './types';

const FONT_STACKS: Record<FontId, string> = {
  inter: 'var(--font-inter-var), Inter, ui-sans-serif, system-ui, sans-serif',
  'open-sans':
    'var(--font-open-sans-var), "Open Sans", ui-sans-serif, system-ui, sans-serif',
  poppins:
    'var(--font-poppins-var), Poppins, ui-sans-serif, system-ui, sans-serif',
  playfair:
    'var(--font-playfair-var), "Playfair Display", ui-serif, Georgia, serif',
  roboto:
    'var(--font-roboto-var), Roboto, ui-sans-serif, system-ui, sans-serif',
};

export function getFontStack(font: FontId): string {
  return FONT_STACKS[font];
}
