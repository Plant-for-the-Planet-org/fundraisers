import { countryCodeToFlag } from './country';
import { getCurrencySymbol } from './currency';

/**
 * List of supported currencies on the platform
 */
export const SUPPORTED_CURRENCIES = [
  'EUR',
  'CHF',
  /*  'USD', 'CZK' */
] as const;

/**
 * Type for Supported currencies on the platform
 */
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Allowed countries for fundraiser creation
 * These countries have full platform support including tax deductibility
 * Plus "Rest of the World" option
 */
export const ALLOWED_COUNTRIES = [
  'DE',
  'ES',
  'CH',
  'ROW',
  // 'US',
  // 'CZ'
] as const;

/**
 * Type for Allowed countries for fundraiser creation
 */
export type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number];

/**
 * Mapping of allowed countries to their currencies
 */
const COUNTRY_CURRENCY_MAP: Record<AllowedCountry, SupportedCurrency> = {
  DE: 'EUR', // Germany
  // US: 'USD', // USA
  ES: 'EUR', // Spain
  // CZ: 'CZK', // Czechia
  CH: 'CHF', // Switzerland
  ROW: 'EUR', // Rest of World — maps to DE (default workspace country)
};

/**
 * Coerce an arbitrary country string to an `AllowedCountry`.
 * Unknown or empty values fall back to `'ROW'`.
 */
export function toAllowedCountry(
  country: string | null | undefined
): AllowedCountry {
  const normalized = (country ?? '').toUpperCase();
  return (ALLOWED_COUNTRIES as readonly string[]).includes(normalized)
    ? (normalized as AllowedCountry)
    : 'ROW';
}

/**
 * Get the primary currency for a given country
 * @param countryCode - ISO 3166-1 alpha-2 country code or 'ROW' for Rest of World
 * @returns Currency code (supported currencies only) or 'EUR' as fallback
 */
export function getCurrencyForCountry(countryCode: string): SupportedCurrency {
  return COUNTRY_CURRENCY_MAP[toAllowedCountry(countryCode)];
}

/**
 * Currency display names for supported currencies
 */
const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  EUR: 'Euro',
  CHF: 'Swiss Franc',
  /* CZK: 'Czech Koruna',
	USD: 'US Dollar', */
};

/**
 * Get all supported currencies with their details
 * @returns Array of supported currencies with code, name, and symbol
 */
export function getSupportedCurrencies(): Array<{
  code: SupportedCurrency;
  name: string;
  symbol: string;
}> {
  return SUPPORTED_CURRENCIES.map(code => ({
    code,
    name: CURRENCY_NAMES[code],
    symbol: getCurrencySymbol(code),
  }));
}

/**
 * Get all allowed countries with their details
 * @param locale - Locale for country names (defaults to 'en')
 * @returns Array of allowed countries with code, name, flag, and currency
 */
export function getAllowedCountries(locale: string = 'en'): Array<{
  code: AllowedCountry;
  name: string;
  flag: string;
  currency: SupportedCurrency;
}> {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });

  return ALLOWED_COUNTRIES.map(code => {
    if (code === 'ROW') {
      return {
        code,
        name: code,
        flag: '🌍',
        currency: getCurrencyForCountry(code),
      };
    }
    return {
      code,
      name: displayNames.of(code) ?? code,
      flag: countryCodeToFlag(code),
      currency: COUNTRY_CURRENCY_MAP[code],
    };
  });
}

const TAX_DEDUCTIBLE_COUNTRIES: ReadonlySet<string> = new Set([
  'DE',
  // 'US',
  'ES',
]);

/**
 * Get tax deductibility information for a country
 * @param countryCode - ISO 3166-1 alpha-2 country code or 'ROW'
 * @param locale - Locale for the country name (defaults to 'en')
 * @returns Whether donations are tax-deductible and the localized country name
 */
export function getTaxDeductibilityInfo(
  countryCode: string,
  locale: string = 'en'
): {
  isDeductible: boolean;
  countryName: string;
} {
  const code = toAllowedCountry(countryCode);
  const resolvedCode = code === 'ROW' ? 'DE' : code; // ROW uses DE as the default workspace country
  let countryName: string;
  try {
    countryName =
      new Intl.DisplayNames([locale], { type: 'region' }).of(resolvedCode) ??
      resolvedCode;
  } catch {
    // Intl.DisplayNames.of throws RangeError on invalid region codes — fall back to the raw code
    countryName = resolvedCode;
  }
  return {
    isDeductible: TAX_DEDUCTIBLE_COUNTRIES.has(resolvedCode),
    countryName,
  };
}

/**
 * Get the currency symbol for a given country
 * @param countryCode - ISO 3166-1 alpha-2 country code or 'ROW'
 * @returns The currency symbol (e.g. '€', '$')
 */
export function getCurrencySymbolForCountry(
  countryCode: AllowedCountry
): string {
  return getCurrencySymbol(COUNTRY_CURRENCY_MAP[countryCode]);
}
