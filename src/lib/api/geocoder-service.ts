// Address autocomplete backed by the ArcGIS World Geocoding Service.
// This is not a ForestCloud host, so it does not go through platformFetch.

const GEOCODE_BASE_URL =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_SUGGESTIONS = 5;
export const MIN_SUGGEST_LENGTH = 4;

export type AddressSuggestion = {
  text: string;
  magicKey: string;
};

export type ResolvedAddress = {
  address: string;
  city: string;
  zipCode: string;
  state: string;
};

type SuggestResponse = {
  suggestions?: Array<{
    text: string;
    magicKey: string;
    isCollection: boolean;
  }>;
};

type CandidatesResponse = {
  candidates?: Array<{
    address: string;
    attributes: {
      StAddr?: string;
      ShortLabel?: string;
      City?: string;
      Postal?: string;
      Region?: string;
    };
  }>;
};

async function geocodeFetch<T>(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal
): Promise<T> {
  const query = new URLSearchParams({ f: 'json', ...params });
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const response = await fetch(`${GEOCODE_BASE_URL}/${path}?${query}`, {
    signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
  });
  if (!response.ok) {
    throw new Error(`Geocoder request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * Returns street-level suggestions for a partial address.
 * `countryCode` is the ISO 3166-1 alpha-2 code the donor picked; it keeps results inside that country.
 */
export async function suggestAddresses(
  text: string,
  countryCode: string | undefined,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  const trimmed = text.trim();
  if (trimmed.length < MIN_SUGGEST_LENGTH) return [];

  const params: Record<string, string> = {
    text: trimmed,
    category: 'Address',
    maxSuggestions: String(MAX_SUGGESTIONS),
  };
  if (countryCode) params.countryCode = countryCode;

  const data = await geocodeFetch<SuggestResponse>('suggest', params, signal);
  return (data.suggestions ?? [])
    .filter(suggestion => !suggestion.isCollection)
    .map(({ text, magicKey }) => ({ text, magicKey }));
}

/**
 * Resolves a picked suggestion into separate address fields.
 * Passing the suggestion's `magicKey` back makes the geocoder return the exact record the donor picked instead of re-searching the text.
 */
export async function resolveAddressSuggestion(
  suggestion: AddressSuggestion,
  signal?: AbortSignal
): Promise<ResolvedAddress | null> {
  const data = await geocodeFetch<CandidatesResponse>(
    'findAddressCandidates',
    {
      SingleLine: suggestion.text,
      magicKey: suggestion.magicKey,
      outFields: 'StAddr,ShortLabel,City,Postal,Region',
      maxLocations: '1',
    },
    signal
  );

  const candidate = data.candidates?.[0];
  if (!candidate) return null;

  const { StAddr, ShortLabel, City, Postal, Region } = candidate.attributes;
  return {
    address: StAddr || ShortLabel || '',
    city: City ?? '',
    zipCode: Postal ?? '',
    state: Region ?? '',
  };
}
