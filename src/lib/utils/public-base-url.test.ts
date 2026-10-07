import { describe, expect, it } from 'vitest';
import { getPublicBaseUrl, getShareOrigin } from './public-base-url';

describe('getPublicBaseUrl', () => {
  it('prefers the forwarded host and protocol a proxy sets', () => {
    const headers = new Headers({
      host: 'localhost:3000',
      'x-forwarded-host': 'startplanting.org',
      'x-forwarded-proto': 'https',
    });
    expect(getPublicBaseUrl(headers).origin).toBe('https://startplanting.org');
  });

  it('guesses http only for localhost', () => {
    expect(
      getPublicBaseUrl(new Headers({ host: 'localhost:3000' })).origin
    ).toBe('http://localhost:3000');
    expect(getPublicBaseUrl(new Headers({ host: 'example.org' })).origin).toBe(
      'https://example.org'
    );
  });

  it('uses the configured app host for share images, whatever the request says', () => {
    const before = process.env.NEXT_PUBLIC_APP_HOST;
    process.env.NEXT_PUBLIC_APP_HOST = 'www.startplanting.org';
    try {
      const spoofed = new Headers({
        host: 'evil.example',
        'x-forwarded-host': 'evil.example',
      });
      expect(getShareOrigin(spoofed)).toBe('https://www.startplanting.org');
    } finally {
      process.env.NEXT_PUBLIC_APP_HOST = before;
    }
  });
});
