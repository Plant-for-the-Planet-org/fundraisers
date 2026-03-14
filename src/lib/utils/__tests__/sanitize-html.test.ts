import { describe, expect, it } from 'vitest';

import { sanitizeDescriptionHtml } from '@/lib/utils/sanitize-html';

describe('sanitizeDescriptionHtml', () => {
  it('keeps basic formatting tags', () => {
    const dirty =
      '<p>Hello <strong>world</strong></p><ul><li>Item 1</li><li>Item 2</li></ul>';
    const clean = sanitizeDescriptionHtml(dirty);

    expect(clean).toContain('<p>');
    expect(clean).toContain('<strong>');
    expect(clean).toContain('<ul>');
    expect(clean).toContain('<li>');
  });

  it('strips script tags and inline event handlers', () => {
    const dirty =
      '<p onclick=\"alert(1)\">Click me</p><script>alert(2)</script>';
    const clean = sanitizeDescriptionHtml(dirty);

    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert(2)');
  });

  it('removes javascript: urls from links', () => {
    const dirty =
      '<a href=\"javascript:alert(1)\">Bad</a><a href=\"https://example.com\">Good</a>';
    const clean = sanitizeDescriptionHtml(dirty);

    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('https://example.com');
  });

  it('handles malformed html gracefully', () => {
    const dirty = '<p>Unclosed paragraph';
    const clean = sanitizeDescriptionHtml(dirty);

    expect(clean).toContain('<p>');
    expect(clean).toContain('Unclosed paragraph');
  });
});


