import type * as UserServiceModule from '../api/user-service';
import type { Auth0TokenClaims } from '../types/auth';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/user-service', async importOriginal => {
  const actual = await importOriginal<typeof UserServiceModule>();
  return {
    ...actual,
    userService: { getProfileSafe: vi.fn(), createProfile: vi.fn() },
  };
});
vi.mock('./auth0-userinfo', () => ({ fetchUserInfo: vi.fn() }));
vi.mock('./signup-country', () => ({ resolveSignupCountry: vi.fn() }));

import { userService } from '../api/user-service';
import { fetchUserInfo } from './auth0-userinfo';
import { ensureProfile } from './implicit-signup';
import { resolveSignupCountry } from './signup-country';

const getProfileSafe = userService.getProfileSafe as ReturnType<typeof vi.fn>;
const createProfile = userService.createProfile as ReturnType<typeof vi.fn>;
const mockedFetchUserInfo = fetchUserInfo as ReturnType<typeof vi.fn>;
const mockedResolveCountry = resolveSignupCountry as ReturnType<typeof vi.fn>;

const TOKEN = 'access-token';
const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email';
const VERIFIED_CLAIM = 'https://app.plant-for-the-planet.org/email_verified';

const verifiedClaims: Auth0TokenClaims = {
  sub: 'auth0|123',
  [EMAIL_CLAIM]: 'ana.silva@example.org',
  [VERIFIED_CLAIM]: true,
};

const profile = { id: 'prf_1' } as UserServiceModule.UserProfile;

function needsSignup(tokenClaims: Auth0TokenClaims = verifiedClaims) {
  return { status: 'needs-signup', tokenClaims };
}

describe('ensureProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedResolveCountry.mockResolvedValue('DE');
    mockedFetchUserInfo.mockResolvedValue(null);
  });

  it('returns an existing profile without creating one', async () => {
    getProfileSafe.mockResolvedValueOnce({ status: 'ok', profile });

    await expect(ensureProfile(TOKEN, 'en')).resolves.toEqual({
      status: 'ready',
      profile,
    });
    expect(createProfile).not.toHaveBeenCalled();
    expect(mockedFetchUserInfo).not.toHaveBeenCalled();
  });

  it('passes an invalid session straight through', async () => {
    getProfileSafe.mockResolvedValueOnce({ status: 'unauthorized' });

    await expect(ensureProfile(TOKEN, 'en')).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(createProfile).not.toHaveBeenCalled();
  });

  it('creates a profile from the derived identity', async () => {
    getProfileSafe.mockResolvedValueOnce(needsSignup());
    mockedFetchUserInfo.mockResolvedValueOnce({
      given_name: 'Ana',
      family_name: 'Silva',
    });
    mockedResolveCountry.mockResolvedValueOnce('IN');
    createProfile.mockResolvedValueOnce(profile);

    await expect(ensureProfile(TOKEN, 'de')).resolves.toEqual({
      status: 'ready',
      profile,
    });
    expect(createProfile).toHaveBeenCalledWith({
      type: 'individual',
      firstname: 'Ana',
      lastname: 'Silva',
      country: 'IN',
      locale: 'de',
      isPrivate: true,
      getNews: false,
      oAuthAccessToken: TOKEN,
    });
  });

  it('still creates a profile when /userinfo is unavailable', async () => {
    getProfileSafe.mockResolvedValueOnce(needsSignup());
    mockedFetchUserInfo.mockResolvedValueOnce(null);
    createProfile.mockResolvedValueOnce(profile);

    await expect(ensureProfile(TOKEN, 'en')).resolves.toMatchObject({
      status: 'ready',
    });
    expect(createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ firstname: 'Ana', lastname: 'Silva' })
    );
  });

  it('creates nothing when the email is unverified', async () => {
    getProfileSafe.mockResolvedValueOnce(
      needsSignup({ ...verifiedClaims, [VERIFIED_CLAIM]: false })
    );

    await expect(ensureProfile(TOKEN, 'en')).resolves.toEqual({
      status: 'failed',
      reason: 'unverified-email',
    });
    expect(createProfile).not.toHaveBeenCalled();
  });

  it('creates nothing when there is no email to identify the user', async () => {
    getProfileSafe.mockResolvedValueOnce(needsSignup({ sub: 'auth0|123' }));

    await expect(ensureProfile(TOKEN, 'en')).resolves.toEqual({
      status: 'failed',
      reason: 'no-email',
    });
    expect(createProfile).not.toHaveBeenCalled();
  });

  it('reports a failure rather than throwing when the platform rejects the create', async () => {
    getProfileSafe.mockResolvedValueOnce(needsSignup());
    createProfile.mockRejectedValueOnce(new Error('400'));

    await expect(ensureProfile(TOKEN, 'en')).resolves.toEqual({
      status: 'failed',
      reason: 'error',
    });
  });

  // The platform has no idempotency here; a duplicate POST fails on a unique index.
  it('sends one create when two callers overlap', async () => {
    getProfileSafe.mockResolvedValue(needsSignup());
    createProfile.mockResolvedValue(profile);

    const [first, second] = await Promise.all([
      ensureProfile(TOKEN, 'en'),
      ensureProfile(TOKEN, 'en'),
    ]);

    expect(createProfile).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it('allows a later retry once the first attempt has settled', async () => {
    getProfileSafe.mockResolvedValue(needsSignup());
    createProfile.mockRejectedValueOnce(new Error('offline'));
    createProfile.mockResolvedValueOnce(profile);

    await expect(ensureProfile(TOKEN, 'en')).resolves.toMatchObject({
      status: 'failed',
    });
    await expect(ensureProfile(TOKEN, 'en')).resolves.toMatchObject({
      status: 'ready',
    });
    expect(createProfile).toHaveBeenCalledTimes(2);
  });
});
