import type { UserProfile } from '@/lib/api/user-service';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/implicit-signup', () => ({ ensureProfile: vi.fn() }));
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

describe('useAuthStore.setAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuthStore.setState({ ...signedOut(), error: null });
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

  // Stage 7 replaces this: a failed creation should leave the user signed in and retry later.
  it('signs the user out when the profile could not be created', async () => {
    mockedEnsureProfile.mockResolvedValueOnce({
      status: 'failed',
      reason: 'error',
    });

    await useAuthStore.getState().setAccessToken(TOKEN);

    expect(useAuthStore.getState()).toMatchObject(signedOut());
  });

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
