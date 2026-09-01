import { describe, expect, it } from 'vitest';
import {
  isAllowedEditorLinkHref,
  isValidExternalHref,
  isWhitelistedHref,
  normalizeLinkHref,
  shouldAutoLinkHref,
} from './link-intent';

describe('normalizeLinkHref', () => {
  it('adds HTTPS to a bare domain', () => {
    expect(normalizeLinkHref('example.com')).toBe('https://example.com');
  });

  it('trims input and preserves explicit schemes', () => {
    expect(normalizeLinkHref('  http://example.com/path  ')).toBe(
      'http://example.com/path'
    );
    expect(normalizeLinkHref('mailto:hello@example.com')).toBe(
      'mailto:hello@example.com'
    );
  });
});

describe('isValidExternalHref', () => {
  it.each([
    'http://example.com',
    'https://sub.example.co.uk/path',
    'mailto:hello@example.com',
  ])('accepts supported link %s', href => {
    expect(isValidExternalHref(href)).toBe(true);
  });

  it.each([
    'ftp://example.com',
    'tel:+123456789',
    'javascript:alert(1)',
    'data:text/plain,hello',
    '/relative/path',
    'example.com',
    'not-a-domain',
    'https://localhost',
  ])('rejects unsupported or malformed link %s', href => {
    expect(isValidExternalHref(href)).toBe(false);
  });
});

describe('TipTap link validation', () => {
  it('accepts supported candidates and rejects unsupported schemes', () => {
    expect(isAllowedEditorLinkHref('https://example.com')).toBe(true);
    expect(isAllowedEditorLinkHref('mailto:hello@example.com')).toBe(true);
    expect(isAllowedEditorLinkHref('example.com')).toBe(true);
    expect(isAllowedEditorLinkHref('ftp://example.com')).toBe(false);
    expect(isAllowedEditorLinkHref('/relative/path')).toBe(false);
  });

  it('accepts valid bare domains for automatic and pasted links', () => {
    expect(shouldAutoLinkHref('example.com')).toBe(true);
    expect(shouldAutoLinkHref('https://example.com')).toBe(true);
    expect(shouldAutoLinkHref('mailto:hello@example.com')).toBe(true);
  });

  it.each([
    'ftp://example.com',
    'tel:+123456789',
    'javascript:alert(1)',
    'data:text/plain,hello',
    '/relative/path',
    'not-a-domain',
  ])('rejects automatic or pasted unsupported link %s', href => {
    expect(shouldAutoLinkHref(href)).toBe(false);
  });
});

describe('isWhitelistedHref', () => {
  it('allows trusted HTTPS links to bypass the warning', () => {
    expect(isWhitelistedHref('https://plant-for-the-planet.org')).toBe(true);
  });

  it('routes trusted HTTP links through the warning', () => {
    expect(isWhitelistedHref('http://plant-for-the-planet.org')).toBe(false);
  });

  it('does not bypass the warning for untrusted or mail links', () => {
    expect(isWhitelistedHref('https://example.com')).toBe(false);
    expect(isWhitelistedHref('mailto:hello@example.com')).toBe(false);
  });
});
