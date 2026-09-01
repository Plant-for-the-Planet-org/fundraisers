import { describe, expect, it } from 'vitest';
import {
  sanitizeDescriptionHtml,
  sanitizeThankYouHtml,
} from '@/lib/utils/sanitize-html';

// Mirrors FONT_SIZE_STEPS in `rich-text-editor.tsx`. A size the toolbar can set
// but the sanitizer strips renders at the base size on the public page, and the
// author never sees it, so the two lists have to agree.
const TOOLBAR_FONT_SIZES = [12, 14, 15, 16, 18, 20, 24, 30];

describe.each([
  ['description', sanitizeDescriptionHtml],
  ['thank-you', sanitizeThankYouHtml],
] as const)('%s sanitizer keeps every toolbar font size', (_name, sanitize) => {
  it.each(TOOLBAR_FONT_SIZES)('%ipx', size => {
    expect(
      sanitize(`<p><span style="font-size: ${size}px;">hi</span></p>`)
    ).toContain(`font-size:${size}px`);
  });
});
