import type { Auth0UserInfo } from '../types/auth';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUserInfo } from './auth0-userinfo';

const TOKEN = 'access-token';
const USERINFO_URL = 'https://accounts.plant-for-the-planet.org/userinfo';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchUserInfo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    // The failure paths warn on purpose; keep the test output readable.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the claims and sends the token as a bearer', async () => {
    const claims: Auth0UserInfo = { given_name: 'Ana', family_name: 'Silva' };
    fetchMock.mockResolvedValueOnce(jsonResponse(claims));

    await expect(fetchUserInfo(TOKEN)).resolves.toEqual({
      status: 'ok',
      userInfo: claims,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(USERINFO_URL);
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
  });

  it('aborts rather than hanging the sign-in', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await fetchUserInfo(TOKEN);

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  // The platform verifies tokens offline, so only Auth0 can tell us the account behind a still-valid token is gone.
  it('reports a revoked identity on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid' }, 401));

    await expect(fetchUserInfo(TOKEN)).resolves.toEqual({ status: 'revoked' });
  });

  it('reports unavailable on other error statuses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'oops' }, 500));

    await expect(fetchUserInfo(TOKEN)).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('reports unavailable when the request fails', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));

    await expect(fetchUserInfo(TOKEN)).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('reports unavailable when the body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));

    await expect(fetchUserInfo(TOKEN)).resolves.toEqual({
      status: 'unavailable',
    });
  });
});
