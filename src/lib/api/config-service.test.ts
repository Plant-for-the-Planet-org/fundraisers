import type * as PlatformFetchModule from './platform-fetch';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./platform-fetch', async importOriginal => {
  const actual = await importOriginal<typeof PlatformFetchModule>();
  return { ...actual, platformFetch: vi.fn() };
});

import { getPlatformConfig, resetPlatformConfigCache } from './config-service';
import { PlatformAPIError, platformFetch } from './platform-fetch';

const mockedPlatformFetch = platformFetch as ReturnType<typeof vi.fn>;

const config = { country: 'IN', currency: 'INR' };

describe('getPlatformConfig', () => {
  beforeEach(() => {
    resetPlatformConfigCache();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedPlatformFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches /config without a token, since the endpoint is unauthenticated', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(config);

    await expect(getPlatformConfig()).resolves.toEqual(config);

    const [path, options] = mockedPlatformFetch.mock.calls[0];
    expect(path).toBe('/config');
    expect(options.token).toBeUndefined();
    expect(options.timeoutMs).toBeGreaterThan(0);
  });

  it('fetches once and shares the result', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(config);

    await Promise.all([getPlatformConfig(), getPlatformConfig()]);
    await getPlatformConfig();

    expect(mockedPlatformFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null on failure rather than throwing', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('timeout', 0, null)
    );

    await expect(getPlatformConfig()).resolves.toBeNull();
  });

  it('retries after a failure instead of caching it', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('network', 0, null)
    );
    mockedPlatformFetch.mockResolvedValueOnce(config);

    await expect(getPlatformConfig()).resolves.toBeNull();
    await expect(getPlatformConfig()).resolves.toEqual(config);
  });
});
