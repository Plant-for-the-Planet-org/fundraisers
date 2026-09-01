import { describe, expect, it } from 'vitest';
import { sanitizeDescriptionHtml, sanitizeThankYouHtml } from './sanitize-html';

describe.each([
  ['description', sanitizeDescriptionHtml],
  ['thank-you note', sanitizeThankYouHtml],
])('%s link sanitization', (_name, sanitize) => {
  it('preserves the forced new-tab and security attributes', () => {
    const result = sanitize(
      '<a href="https://example.com" title="Example">Example</a>'
    );

    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="nofollow ugc noopener noreferrer"');
  });
});
