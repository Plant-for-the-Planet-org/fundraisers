import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAddressSuggestion, suggestAddresses } from './geocoder-service';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

describe('geocoder-service', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('suggestAddresses', () => {
    it('does not call the geocoder for short input', async () => {
      await expect(suggestAddresses('Am ', 'DE')).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('scopes the request to the picked country and drops collections', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          suggestions: [
            {
              text: 'Am Bahnhof 1, 82449 Uffing',
              magicKey: 'k1',
              isCollection: false,
            },
            { text: 'Am Bahnhof', magicKey: 'k2', isCollection: true },
          ],
        })
      );

      const result = await suggestAddresses('Am Bahnhof', 'DE');

      expect(result).toEqual([
        { text: 'Am Bahnhof 1, 82449 Uffing', magicKey: 'k1' },
      ]);
      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.origin).toBe('https://geocode.arcgis.com');
      expect(url.pathname).toMatch(/\/suggest$/);
      expect(url.searchParams.get('text')).toBe('Am Bahnhof');
      expect(url.searchParams.get('countryCode')).toBe('DE');
      expect(url.searchParams.get('category')).toBe('Address');
      expect(url.searchParams.get('f')).toBe('json');
      expect(url.searchParams.has('token')).toBe(false);
    });

    it('omits countryCode when no country is picked yet', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ suggestions: [] }));

      await suggestAddresses('Am Bahnhof', undefined);

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.searchParams.has('countryCode')).toBe(false);
    });

    it('throws on a non-2xx response', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500));

      await expect(suggestAddresses('Am Bahnhof', 'DE')).rejects.toThrow(/500/);
    });
  });

  describe('resolveAddressSuggestion', () => {
    it('sends the magicKey and maps the candidate to form fields', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            {
              address: 'Am Bahnhof 1, 82449, Uffing am Staffelsee',
              attributes: {
                StAddr: 'Am Bahnhof 1',
                ShortLabel: 'Am Bahnhof 1',
                City: 'Uffing am Staffelsee',
                Postal: '82449',
                Region: 'Bayern',
              },
            },
          ],
        })
      );

      const result = await resolveAddressSuggestion({
        text: 'Am Bahnhof 1, 82449 Uffing',
        magicKey: 'k1',
      });

      expect(result).toEqual({
        address: 'Am Bahnhof 1',
        city: 'Uffing am Staffelsee',
        zipCode: '82449',
        state: 'Bayern',
      });
      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.pathname).toMatch(/\/findAddressCandidates$/);
      expect(url.searchParams.get('magicKey')).toBe('k1');
      expect(url.searchParams.get('maxLocations')).toBe('1');
    });

    it('falls back to ShortLabel when StAddr is missing', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            {
              address: 'x',
              attributes: { ShortLabel: 'Marienplatz 1', City: 'München' },
            },
          ],
        })
      );

      const result = await resolveAddressSuggestion({
        text: 'x',
        magicKey: 'k',
      });

      expect(result).toEqual({
        address: 'Marienplatz 1',
        city: 'München',
        zipCode: '',
        state: '',
      });
    });

    it('returns null when there is no candidate', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ candidates: [] }));

      await expect(
        resolveAddressSuggestion({ text: 'x', magicKey: 'k' })
      ).resolves.toBeNull();
    });
  });
});
