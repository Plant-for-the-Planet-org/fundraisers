import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuthTime,
  isSignInOlderThan,
  markInteractiveSignIn,
  readAuthTime,
} from './auth-time';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.assign(globalThis, {
    window: {},
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
});

afterEach(() => {
  const g = globalThis as { window?: unknown; localStorage?: unknown };
  delete g.window;
  delete g.localStorage;
});

describe('markInteractiveSignIn', () => {
  it('stores the sign-in time in whole seconds', () => {
    markInteractiveSignIn(1_700_000_000_999);
    expect(readAuthTime()).toBe(1_700_000_000);
  });

  it('reads null when nothing is stored or the value is not a number', () => {
    expect(readAuthTime()).toBeNull();
    store.set('auth_time', 'later');
    expect(readAuthTime()).toBeNull();
  });

  it('clears the value', () => {
    markInteractiveSignIn(1_700_000_000_000);
    clearAuthTime();
    expect(readAuthTime()).toBeNull();
  });
});

describe('isSignInOlderThan', () => {
  const fourHours = 4 * 60 * 60 * 1000;
  const now = 1_700_000_000_000;

  it('is old when the time is unknown', () => {
    expect(isSignInOlderThan(null, fourHours, now)).toBe(true);
  });

  it('is fresh just inside the window', () => {
    const authTime = Math.floor((now - fourHours) / 1000) + 1;
    expect(isSignInOlderThan(authTime, fourHours, now)).toBe(false);
  });

  it('is old just outside the window', () => {
    const authTime = Math.floor((now - fourHours) / 1000) - 1;
    expect(isSignInOlderThan(authTime, fourHours, now)).toBe(true);
  });
});
