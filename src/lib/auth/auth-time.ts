const AUTH_TIME_KEY = 'auth_time';

const DEFAULT_RECENT_SIGN_IN_MAX_AGE_MS = 4 * 60 * 60 * 1000;

function readMaxAgeOverride(): number | null {
  const raw = process.env.NEXT_PUBLIC_SWITCH_ACCOUNT_AFTER_MS;
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Once the last interactive sign-in is older than this, the donation form offers to switch accounts.
 * `NEXT_PUBLIC_SWITCH_ACCOUNT_AFTER_MS` overrides it. Set it to 0 to always show the link while testing.
 */
export const RECENT_SIGN_IN_MAX_AGE_MS =
  readMaxAgeOverride() ?? DEFAULT_RECENT_SIGN_IN_MAX_AGE_MS;

const isBrowser = () => typeof window !== 'undefined';

/**
 * Records that a person just signed in through Auth0's login screen, as seconds since the epoch.
 * Silent refreshes must not call this: nobody typed anything, so the recorded time stays.
 */
export function markInteractiveSignIn(now = Date.now()) {
  if (!isBrowser()) return;
  localStorage.setItem(AUTH_TIME_KEY, String(Math.floor(now / 1000)));
}

export function readAuthTime(): number | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(AUTH_TIME_KEY);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function clearAuthTime() {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_TIME_KEY);
}

/** True when the sign-in is older than `maxAgeMs`. An unknown time counts as old, so sessions from before it was recorded qualify too. */
export function isSignInOlderThan(
  authTime: number | null,
  maxAgeMs: number,
  now = Date.now()
): boolean {
  if (authTime === null) return true;
  return now - authTime * 1000 > maxAgeMs;
}
