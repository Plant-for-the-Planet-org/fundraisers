import { describe, expect, it } from 'vitest';
import { buildShareUrl, displayUrl, isValidRefCode } from './links';
import { getReferralCode, readRefParam } from './referral';

describe('buildShareUrl', () => {
  it('tags the link with the channel and the person who shares it', () => {
    expect(
      buildShareUrl({
        origin: 'https://startplanting.org',
        slug: 'forests',
        source: 'instagram',
        medium: 'social',
        ref: 'k7f2q',
      })
    ).toBe(
      'https://startplanting.org/raise/forests?utm_source=instagram&utm_medium=social&ref=k7f2q'
    );
  });

  it('leaves out a ref that is not a valid code', () => {
    expect(
      buildShareUrl({
        origin: 'https://startplanting.org',
        slug: 'forests',
        ref: 'not a code!',
      })
    ).toBe('https://startplanting.org/raise/forests');
  });
});

describe('ref codes', () => {
  it('accepts short codes and refuses anything else', () => {
    expect(isValidRefCode('k7f2q')).toBe(true);
    expect(isValidRefCode('abc')).toBe(false);
    expect(isValidRefCode('<script>')).toBe(false);
    expect(isValidRefCode('x'.repeat(33))).toBe(false);
    expect(isValidRefCode(null)).toBe(false);
  });

  it('reads the code from a query string and ignores a bad one', () => {
    expect(readRefParam('?utm_source=whatsapp&ref=k7f2q')).toBe('k7f2q');
    expect(readRefParam('?ref=%3Cb%3E')).toBeNull();
    expect(readRefParam('')).toBeNull();
  });

  it('takes the person’s own code from the profile', () => {
    expect(getReferralCode({ referralCode: 'k7f2q' })).toBe('k7f2q');
    expect(getReferralCode({ referralCode: null })).toBeNull();
    expect(getReferralCode(undefined)).toBeNull();
  });
});

describe('displayUrl', () => {
  it('shows the link without protocol or tags', () => {
    expect(displayUrl('https://startplanting.org', 'forests')).toBe(
      'startplanting.org/raise/forests'
    );
  });
});
