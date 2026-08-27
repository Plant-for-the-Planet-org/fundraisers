/**
 * Shared client-side cookie helpers for locale persistence. Used by
 * `locale-store.ts` and `locale-profile-sync.tsx` to read and write the
 * `ui-locale` cookie without duplicating the same regex-based logic in each.
 */

import { normalizeToLocale, parseLocaleCookieValue } from './resolve-locale';
import { routing } from './routing';

export function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function writeCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax`;
}

/**
 * The locale this browser is currently being served.
 *
 * For code outside React that cannot call `useLocale()`. Inside a component, use that hook instead.
 */
export function getClientLocale(): string {
  const { locale } = parseLocaleCookieValue(readCookie('ui-locale'));
  return normalizeToLocale(locale) ?? routing.defaultLocale;
}
