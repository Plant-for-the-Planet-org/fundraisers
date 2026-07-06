/**
 * Shared client-side cookie helpers for locale persistence. Used by
 * `locale-store.ts` and `locale-profile-sync.tsx` to read and write the
 * `ui-locale` cookie without duplicating the same regex-based logic in each.
 */

export function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function writeCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax`;
}
