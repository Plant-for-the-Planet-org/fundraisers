import { getWorkspaceProfile } from '@/lib/workspaces/registry';
import { countryCodeToFlag, getCountry } from './country';
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
 * Coerce an arbitrary country string to an `AllowedCountry`.
 * Unknown or empty values fall back to `'ROW'`.
 */
export function toAllowedCountry(
  country: string | null | undefined
): AllowedCountry {
  const normalized = (country ?? '').trim().toUpperCase();
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
  return getWorkspaceProfile(toAllowedCountry(countryCode)).currency;
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
  return ALLOWED_COUNTRIES.map(code => {
    if (code === 'ROW') {
      return {
        code,
        name: code,
        flag: '🌍',
        currency: getWorkspaceProfile(code).currency,
      };
    }
    return {
      code,
      name: getCountry(code, locale),
      flag: countryCodeToFlag(code),
      currency: getWorkspaceProfile(code).currency,
    };
  });
}

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
  const profile = getWorkspaceProfile(toAllowedCountry(countryCode));
  return {
    isDeductible: profile.taxDeductible,
    // `apiCountry` is the concrete country backing the workspace (ROW → DE), so
    // it also gives the right country name to display.
    countryName: getCountry(profile.apiCountry, locale),
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
  return getCurrencySymbol(getWorkspaceProfile(countryCode).currency);
}
