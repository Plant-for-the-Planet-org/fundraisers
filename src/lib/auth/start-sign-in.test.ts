import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/auth0-config', () => ({
  buildUniversalLoginAuthorizeUrl: vi.fn(
    async () => 'https://auth.example/authorize?client_id=abc'
  ),
  buildSignupAuthorizeUrl: vi.fn(
    async () => 'https://auth.example/authorize?screen_hint=signup'
  ),
  buildSocialAuthorizeUrl: vi.fn(
    async () => 'https://auth.example/authorize?connection=google-oauth2'
  ),
  exchangeCodeForTokens: vi.fn(),
}));
vi.mock('@/lib/auth/oauth-state', () => ({
  clearOAuthState: vi.fn(),
  getStoredOAuthState: vi.fn(),
}));
vi.mock('@/lib/auth/sign-in-popup', () => ({
  openSignInPopup: vi.fn(),
  waitForSignInPopup: vi.fn(),
}));
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: { getState: vi.fn() },
}));

import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';
import { signInWithRedirect } from './start-sign-in';

describe('signInWithRedirect', () => {
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    assign = vi.fn();
    vi.stubGlobal('window', { location: { assign } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function authorizeUrl(): URL {
    return new URL(assign.mock.calls[0][0]);
  }

  it.each([
    { method: 'email', email: 'a@example.com' },
    { method: 'signup' },
    { method: 'social', connection: 'google-oauth2' },
  ] as const)('sends ui_locales for $method', async request => {
    await signInWithRedirect(request, DEFAULT_REDIRECT_PATH, { locale: 'de' });

    expect(authorizeUrl().searchParams.get('ui_locales')).toBe('de');
  });

  it('keeps the params the builder set', async () => {
    await signInWithRedirect({ method: 'signup' }, DEFAULT_REDIRECT_PATH, {
      locale: 'de',
    });

    expect(authorizeUrl().searchParams.get('screen_hint')).toBe('signup');
  });

  it('sends no ui_locales without a locale', async () => {
    await signInWithRedirect(
      { method: 'email', email: 'a@example.com' },
      DEFAULT_REDIRECT_PATH
    );

    expect(authorizeUrl().searchParams.has('ui_locales')).toBe(false);
  });

  it('adds prompt=login alongside the locale when forcing a login', async () => {
    await signInWithRedirect({ method: 'signup' }, DEFAULT_REDIRECT_PATH, {
      locale: 'de',
      forceLogin: true,
    });

    const params = authorizeUrl().searchParams;
    expect(params.get('prompt')).toBe('login');
    expect(params.get('ui_locales')).toBe('de');
  });
});
