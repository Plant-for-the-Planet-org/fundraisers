/**
 * Shared client-side cookie helpers for locale persistence. Used by
 * `locale-store.ts`, `locale-profile-sync.tsx`, and `auth-store.ts` to read,
 * write, and clear the `ui-locale` cookie without duplicating the same
 * regex-based logic in each.
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

export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;samesite=lax`;
}
