import type * as ConfigServiceModule from '../api/config-service';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/config-service', async importOriginal => {
  const actual = await importOriginal<typeof ConfigServiceModule>();
  return { ...actual, getPlatformConfig: vi.fn() };
});

import { getPlatformConfig } from '../api/config-service';
import { resolveSignupCountry } from './signup-country';

const mockedGetPlatformConfig = getPlatformConfig as ReturnType<typeof vi.fn>;

describe('resolveSignupCountry', () => {
  beforeEach(() => {
    mockedGetPlatformConfig.mockReset();
  });

  it('uses the geolocated country', async () => {
    mockedGetPlatformConfig.mockResolvedValueOnce({ country: 'IN' });

    await expect(resolveSignupCountry('en')).resolves.toBe('IN');
  });

  it('falls back to loc.countryCode', async () => {
    mockedGetPlatformConfig.mockResolvedValueOnce({
      loc: { countryCode: 'br' },
    });

    await expect(resolveSignupCountry('en')).resolves.toBe('BR');
  });

  // T1 is a Tor exit node and XX is unknown; both mean the platform could not place the caller.
  it.each(['T1', 'XX', '', '  '])(
    'treats %j as unresolved and uses the locale',
    async unresolved => {
      mockedGetPlatformConfig.mockResolvedValueOnce({ country: unresolved });

      await expect(resolveSignupCountry('de')).resolves.toBe('DE');
    }
  );

  it('ignores a country the platform would reject', async () => {
    mockedGetPlatformConfig.mockResolvedValueOnce({ country: 'ZZ' });

    await expect(resolveSignupCountry('en')).resolves.toBe('US');
  });

  it('uses the locale when /config is unavailable', async () => {
    mockedGetPlatformConfig.mockResolvedValueOnce(null);

    await expect(resolveSignupCountry('de')).resolves.toBe('DE');
  });

  it('reads the language from a regional locale tag', async () => {
    mockedGetPlatformConfig.mockResolvedValueOnce(null);

    await expect(resolveSignupCountry('de-AT')).resolves.toBe('DE');
  });

  it('falls back to DE for a locale we do not map', async () => {
    mockedGetPlatformConfig.mockResolvedValueOnce(null);

    await expect(resolveSignupCountry('fr')).resolves.toBe('DE');
  });
});
