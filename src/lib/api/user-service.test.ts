import type * as PlatformFetchModule from './platform-fetch';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./platform-fetch', async importOriginal => {
  const actual = await importOriginal<typeof PlatformFetchModule>();
  return { ...actual, platformFetch: vi.fn() };
});

import type { UserProfileResponse } from './user-service';

import { PlatformAPIError, platformFetch } from './platform-fetch';
import { userService } from './user-service';

const mockedPlatformFetch = platformFetch as ReturnType<typeof vi.fn>;

const TOKEN = 'access-token';

const profile = {
  id: 'prf_1',
  email: 'ana@example.org',
} as UserProfileResponse;

// What the platform actually puts in a 303 body: the decoded access token claims under `userInfo`.
const noProfileBody = {
  message: 'The authenticated user has not signed up',
  userInfo: {
    sub: 'auth0|123',
    'https://app.plant-for-the-planet.org/email': 'ana@example.org',
    'https://app.plant-for-the-planet.org/email_verified': true,
    scope: 'openid profile email',
  },
};

describe('userService.getProfileSafe', () => {
  beforeEach(() => {
    mockedPlatformFetch.mockReset();
  });

  it('returns the profile on success', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(profile);

    await expect(userService.getProfileSafe(TOKEN)).resolves.toEqual({
      status: 'ok',
      profile,
    });
    expect(mockedPlatformFetch).toHaveBeenCalledWith('/profile', {
      token: TOKEN,
    });
  });

  it('reports needs-signup on a 303 and hands back the token claims', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 303, noProfileBody)
    );

    await expect(userService.getProfileSafe(TOKEN)).resolves.toEqual({
      status: 'needs-signup',
      tokenClaims: noProfileBody.userInfo,
    });
  });

  it('reports needs-signup with empty claims when the 303 body is not what we expect', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 303, 'Redirecting')
    );

    await expect(userService.getProfileSafe(TOKEN)).resolves.toEqual({
      status: 'needs-signup',
      tokenClaims: {},
    });
  });

  it('reports unauthorized on a 401', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 401, null)
    );

    await expect(userService.getProfileSafe(TOKEN)).resolves.toEqual({
      status: 'unauthorized',
    });
  });

  // A 403 is a denied impersonation switch, not an invalid session. Swallowing it would clear the impersonator's own auth.
  it('rethrows a 403', async () => {
    const error = new PlatformAPIError('http', 403, null);
    mockedPlatformFetch.mockRejectedValueOnce(error);

    await expect(userService.getProfileSafe(TOKEN)).rejects.toBe(error);
  });

  it('rethrows a 500', async () => {
    const error = new PlatformAPIError('http', 500, null);
    mockedPlatformFetch.mockRejectedValueOnce(error);

    await expect(userService.getProfileSafe(TOKEN)).rejects.toBe(error);
  });

  it('rethrows a timeout', async () => {
    const error = new PlatformAPIError('timeout', 0, null);
    mockedPlatformFetch.mockRejectedValueOnce(error);

    await expect(userService.getProfileSafe(TOKEN)).rejects.toBe(error);
  });

  it('rethrows a non-platform error', async () => {
    const error = new TypeError('boom');
    mockedPlatformFetch.mockRejectedValueOnce(error);

    await expect(userService.getProfileSafe(TOKEN)).rejects.toBe(error);
  });
});

describe('userService.createProfile', () => {
  beforeEach(() => {
    mockedPlatformFetch.mockReset();
  });

  // The platform's firewall answers 303 whenever an Authorization header is present, so this call must stay unauthenticated and carry the token in the body instead.
  it('posts without a token so no Authorization header is sent', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(profile);

    const payload = {
      type: 'individual',
      firstname: 'Ana',
      lastname: 'Silva',
      country: 'DE',
      locale: 'en',
      isPrivate: true,
      getNews: false,
      oAuthAccessToken: TOKEN,
    } as const;

    await expect(userService.createProfile(payload)).resolves.toBe(profile);

    const [path, options] = mockedPlatformFetch.mock.calls[0];
    expect(path).toBe('/profile');
    expect(options.method).toBe('POST');
    expect(options.body).toEqual(payload);
    expect(options.token).toBeUndefined();
  });
});
