import { z } from 'zod';

const emailSchema = z.email();

/**
 * Cleans up what people actually paste into an email field.
 *
 * "Copy link address" on a `mailto:` link puts `mailto:someone@example.org` on the clipboard, and on 2026-09-10 that reached the platform as a co-host address. The intent behind such a paste is unambiguous, so the prefix is dropped rather than refused.
 */
export function normalizeEmail(value: string): string {
  return value
    .trim()
    .replace(/^mailto:/i, '')
    .trim();
}

/**
 * Whether the platform will store the address and the mailer can send to it.
 *
 * Same check as the donation form, which is the point: an address this returns true for has to survive all the way to a rendered email. The pattern this replaced, `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, accepted anything without spaces around the `@`, so `mailto:someone@example.org` and `a..b@example.org` both passed it and both are refused when the email is built.
 */
export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(normalizeEmail(value)).success;
}
