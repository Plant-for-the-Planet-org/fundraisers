import type { UserProfile } from '@/lib/api/user-service';
import type * as ImplicitSignupModule from '@/lib/auth/implicit-signup';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/implicit-signup', async importOriginal => {
  const actual = await importOriginal<typeof ImplicitSignupModule>();
  return { ...actual, ensureProfile: vi.fn() };
});
vi.mock('@/i18n/locale-cookie', () => ({ getClientLocale: () => 'de' }));

import { ensureProfile } from '@/lib/auth/implicit-signup';
import { useAuthStore } from './auth-store';

const mockedEnsureProfile = ensureProfile as ReturnType<typeof vi.fn>;

const TOKEN = 'access-token';

const profile = {
  id: 'prf_1',
  email: 'ana@example.org',
  displayName: 'Ana Silva',
  image: null,
} as UserProfile;

function signedOut() {
  return { user: null, accessToken: null, isAuthenticated: false };
}

const identity = {
  sub: 'auth0|123',
  email: 'ana@example.org',
  name: 'Ana Silva',
};

function failed(reason: string) {
  return { status: 'failed', reason, identity };
}

describe('useAuthStore.setAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuthStore.setState({
      ...signedOut(),
      error: null,
      profileStatus: 'ready',
      profileFailureReason: null,
    });
  });

  it('signs the user in once the profile is ready', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({ status: 'ready', profile });

    await useAuthStore.getState().setAccessToken(TOKEN);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toMatchObject({
      sub: 'prf_1',
      email: 'ana@example.org',
      name: 'Ana Silva',
      profile,
    });
  });

  it('passes the browser locale through to signup', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({ status: 'ready', profile });

    await useAuthStore.getState().setAccessToken(TOKEN);

    expect(mockedEnsureProfile).toHaveBeenCalledWith(TOKEN, 'de');
  });

  it('signs the user out when the session is not valid', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({ status: 'unauthorized' });

    await useAuthStore.getState().setAccessToken(TOKEN);

    expect(useAuthStore.getState()).toMatchObject(signedOut());
  });

  // A failed creation is not a failed sign-in. Signing the user out would lose a working session over something a retry may fix.
  it('keeps the user signed in when the profile could not be created', async () => {
    mockedEnsureProfile.mockResolvedValueOnce(failed('create-failed'));

    await useAuthStore.getState().setAccessToken(TOKEN);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.profileStatus).toBe('error');
    expect(state.profileFailureReason).toBe('create-failed');
    expect(state.user).toMatchObject({ email: 'ana@example.org' });
    expect(state.user?.profile).toBeUndefined();
  });

  // None of these can be fixed by retrying or navigating. Keeping the user signed in would only hide a session that can never work.
  it.each(['identity-revoked', 'unverified-email', 'no-email'])(
    'signs the user out on a %s failure',
    async reason => {
      mockedEnsureProfile.mockResolvedValueOnce(failed(reason));

      await useAuthStore.getState().setAccessToken(TOKEN);

      expect(useAuthStore.getState()).toMatchObject(signedOut());
    }
  );

  it('signs the user out when signup throws outright', async () => {
    mockedEnsureProfile.mockRejectedValueOnce(new Error('boom'));

    await useAuthStore.getState().setAccessToken(TOKEN);

    expect(useAuthStore.getState()).toMatchObject(signedOut());
  });

  it('clears auth when the token is removed', async () => {
    await useAuthStore.getState().setAccessToken(null);

    expect(mockedEnsureProfile).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject(signedOut());
  });

  it('does no work when the same token is set again', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({ status: 'ready', profile });
    await useAuthStore.getState().setAccessToken(TOKEN);

    await useAuthStore.getState().setAccessToken(TOKEN);

    expect(mockedEnsureProfile).toHaveBeenCalledTimes(1);
  });
});

describe('useAuthStore.retryProfileSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuthStore.setState({
      user: null,
      accessToken: TOKEN,
      isAuthenticated: true,
      profileStatus: 'error',
      profileFailureReason: 'create-failed',
      error: null,
    });
  });

  it('completes the signup and clears the degraded state', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({ status: 'ready', profile });

    await useAuthStore.getState().retryProfileSetup();

    const state = useAuthStore.getState();
    expect(state.profileStatus).toBe('ready');
    expect(state.profileFailureReason).toBeNull();
    expect(state.user).toMatchObject({ profile });
  });

  it('stays degraded when the retry fails again', async () => {
    mockedEnsureProfile.mockResolvedValueOnce(failed('create-failed'));

    await useAuthStore.getState().retryProfileSetup();

    expect(useAuthStore.getState().profileStatus).toBe('error');
  });

  it('signs the user out if the session has since expired', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({ status: 'unauthorized' });

    await useAuthStore.getState().retryProfileSetup();

    expect(useAuthStore.getState()).toMatchObject(signedOut());
  });

  it('does nothing once the profile is ready', async () => {
    useAuthStore.setState({ profileStatus: 'ready' });

    await useAuthStore.getState().retryProfileSetup();

    expect(mockedEnsureProfile).not.toHaveBeenCalled();
  });

  // Retrying cannot fix these; the user has to verify their email or sign in with an account that has one.
  it.each(['unverified-email', 'no-email'] as const)(
    'does not retry a %s failure',
    async reason => {
      useAuthStore.setState({ profileFailureReason: reason });

      await useAuthStore.getState().retryProfileSetup();

      expect(mockedEnsureProfile).not.toHaveBeenCalled();
    }
  );

  it('does nothing without a token', async () => {
    useAuthStore.setState({ accessToken: null });

    await useAuthStore.getState().retryProfileSetup();

    expect(mockedEnsureProfile).not.toHaveBeenCalled();
  });
});
