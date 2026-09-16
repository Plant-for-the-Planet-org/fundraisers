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
 * The sign-in time is a convenience, so a browser that refuses localStorage must never break signing in or out.
 * Safari private mode, blocked site data and a full quota all throw here.
 */
function writeStored(value: string) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(AUTH_TIME_KEY, value);
  } catch {
    // An unknown sign-in time counts as old, which is the safe side.
  }
}

function readStored(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(AUTH_TIME_KEY);
  } catch {
    return null;
  }
}

function removeStored() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(AUTH_TIME_KEY);
  } catch {
    // Nothing to do: the caller is signing out either way.
  }
}

/**
 * Records that a person just signed in through Auth0's login screen, as seconds since the epoch.
 * Silent refreshes must not call this: nobody typed anything, so the recorded time stays.
 */
export function markInteractiveSignIn(now = Date.now()) {
  writeStored(String(Math.floor(now / 1000)));
}

export function readAuthTime(): number | null {
  const raw = readStored();
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function clearAuthTime() {
  removeStored();
}

/**
 * Restores the previous sign-in time if an account switch fails.
 */
export function restoreAuthTime(value: number | null) {
  if (value === null) {
    removeStored();
    return;
  }
  writeStored(String(value));
}

/** True when the sign-in is older than `maxAgeMs`. An unknown time counts as old, so sessions from before it was recorded qualify too. */
export function isSignInOlderThan(
  authTime: number | null,
  maxAgeMs: number,
  now = Date.now()
): boolean {
  if (authTime === null) return true;
  const age = now - authTime * 1000;
  // If the sign-in time is in the future, treat it as invalid and old.
  if (age < 0) return true;
  return age > maxAgeMs;
}
