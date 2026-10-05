import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getValidStoredToken } from './auth';

const store = new Map<string, string>();

function tokenExpiringAt(epochSeconds: number) {
  const payload = Buffer.from(JSON.stringify({ exp: epochSeconds }))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.signature`;
}

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

describe('getValidStoredToken', () => {
  const now = Math.floor(Date.now() / 1000);

  it('keeps the token and the sign-in time while the token is valid', () => {
    const token = tokenExpiringAt(now + 3600);
    store.set('access_token', token);
    store.set('auth_time', String(now));

    expect(getValidStoredToken()).toBe(token);
    expect(store.get('auth_time')).toBe(String(now));
  });

  it('drops the sign-in time along with an expired token', () => {
    store.set('access_token', tokenExpiringAt(now - 3600));
    store.set('auth_time', String(now - 60));

    expect(getValidStoredToken()).toBeNull();
    expect(store.has('access_token')).toBe(false);
    expect(store.has('auth_time')).toBe(false);
  });

  it('drops the sign-in time when the token cannot be parsed', () => {
    store.set('access_token', 'not-a-jwt');
    store.set('auth_time', String(now));

    expect(getValidStoredToken()).toBeNull();
    expect(store.has('auth_time')).toBe(false);
  });
});
