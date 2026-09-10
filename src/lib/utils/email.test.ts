import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('drops a pasted mailto: prefix', () => {
    expect(normalizeEmail('mailto:germany@plant-for-the-planet.org')).toBe(
      'germany@plant-for-the-planet.org'
    );
  });

  it('drops it whatever case the link used, and trims around it', () => {
    expect(normalizeEmail('  MailTo: germany@plant-for-the-planet.org  ')).toBe(
      'germany@plant-for-the-planet.org'
    );
  });

  it('leaves an ordinary address alone', () => {
    expect(normalizeEmail('germany@plant-for-the-planet.org')).toBe(
      'germany@plant-for-the-planet.org'
    );
  });
});

describe('isValidEmail', () => {
  it('accepts the pasted link, because the prefix is dropped first', () => {
    expect(isValidEmail('mailto:germany@plant-for-the-planet.org')).toBe(true);
  });

  it.each([
    'germany@plant-for-the-planet.org',
    'germany+trees@plant-for-the-planet.org',
    "o'brien@example.de",
  ])('accepts %s', address => {
    expect(isValidEmail(address)).toBe(true);
  });

  // Everything here passed the pattern this replaced, and every one of them is refused by the
  // platform when it builds the email.
  it.each([
    'a..b@example.com',
    'germany@plant-for-the-planet.org,',
    'germany@plant-for-the-planet',
    'Germany <germany@plant-for-the-planet.org>',
    'a@example.com, b@example.com',
    'germany.plant-for-the-planet.org',
    'germany@',
    'mailto:germany@',
    '',
  ])('rejects %s', address => {
    expect(isValidEmail(address)).toBe(false);
  });
});
