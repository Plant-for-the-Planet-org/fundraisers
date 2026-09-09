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
  ['thank-you note', sanitizeThankYouHtml],
] as const)('%s link sanitization', (_name, sanitize) => {
  it('preserves the forced new-tab and security attributes', () => {
    const result = sanitize(
      '<a href="https://example.com" title="Example">Example</a>'
    );

    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="nofollow ugc noopener noreferrer"');
  });
});

describe.each([
  ['description', sanitizeDescriptionHtml],
  ['thank-you note', sanitizeThankYouHtml],
] as const)('%s sanitizer keeps every toolbar font size', (_name, sanitize) => {
  it.each(TOOLBAR_FONT_SIZES)('%ipx', size => {
    expect(
      sanitize(`<p><span style="font-size: ${size}px;">hi</span></p>`)
    ).toContain(`font-size:${size}px`);
  });
});
