/**
 * Country mapping utility for displaying country names in different locales.
 * Uses i18n-iso-countries for comprehensive country coverage and localization,returning the full (official) country name, e.g. 'United States of America'.
 */

import countries from 'i18n-iso-countries';
import deLocale from 'i18n-iso-countries/langs/de.json';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register one language pack per locale the app serves. Keep this list in sync with the locales in `src/i18n/routing.ts`
countries.registerLocale(enLocale);
countries.registerLocale(deLocale);

/**
 * Offset to convert an ASCII uppercase letter to its Unicode flag letter code point.
 *
 * Unicode encodes a set of 26 invisible "flag letters" (A–Z) that renderers combine
 * in pairs to display country flag emojis. For example, the pair for "D" and "E"
 * renders as 🇩🇪. The first of these flag letters ("A") lives at code point 0x1F1E6,
 * while ASCII "A" is 65 — so subtracting 65 gives the offset needed to map any
 * uppercase letter to its corresponding flag letter.
 */
const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 65;

/**
 * Converts an ISO 3166-1 alpha-2 country code to its flag emoji.
 *
 * @param countryCode - Two-letter country code (e.g. `"DE"`, `"US"`)
 * @returns The flag emoji, or an empty string if the code is invalid
 *
 * @example
 * countryCodeToFlag('DE') // '🇩🇪'
 * countryCodeToFlag('US') // '🇺🇸'
 */
export function countryCodeToFlag(countryCode: string): string {
  const normalizedCode = countryCode.toUpperCase();

  // Validate country code format (should be 2 letters)
  if (!/^[A-Z]{2}$/.test(normalizedCode)) return '';

  return normalizedCode
    .split('')
    .map(char =>
      String.fromCodePoint(REGIONAL_INDICATOR_OFFSET + char.charCodeAt(0))
    )
    .join('');
}

/**
 * Get the localized country name for a given country code.
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'DE', 'US', 'FR')
 * @param locale - The locale for the country name (defaults to 'en')
 * @returns The localized country name, or the uppercase code if unknown
 *
 * @example
 * getCountry('DE', 'en') // Returns 'Germany'
 * getCountry('DE', 'de') // Returns 'Deutschland'
 * getCountry('US', 'en') // Returns 'United States of America'
 */
export function getCountry(countryCode: string, locale: string = 'en'): string {
  try {
    // Ensure country code is uppercase
    const code = countryCode.toUpperCase();

    // Convert locale from 'en-US' format to 'en' format if needed
    const lang = locale.split('-')[0] || 'en';

    // Get country name using i18n-iso-countries (full official name)
    const countryName = countries.getName(code, lang as any);

    // Return the localized name or fallback to code
    return countryName || code;
  } catch (error) {
    // Fallback to country code if locale is not supported or other error
    console.warn(
      `Failed to get country name for ${countryCode} in locale ${locale}:`,
      error
    );
    return countryCode.toUpperCase();
  }
}

/**
 * Get both country name and flag for display
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param locale - The locale for the country name (defaults to 'en')
 * @param showFlag - Whether to include the flag emoji (defaults to true)
 * @returns Object with country name and optional flag
 *
 * @example
 * getCountryDisplay('DE', 'en') // Returns { name: 'Germany', flag: '🇩🇪', display: '🇩🇪 Germany' }
 * getCountryDisplay('DE', 'de', false) // Returns { name: 'Deutschland', flag: '🇩🇪', display: 'Deutschland' }
 */
export function getCountryDisplay(
  countryCode: string,
  locale: string = 'en',
  showFlag: boolean = true
): { name: string; flag: string; display: string } {
  const name = getCountry(countryCode, locale);
  const flag = countryCodeToFlag(countryCode);
  const display = showFlag && flag ? `${flag} ${name}` : name;

  return { name, flag, display };
}

/**
 * Get all available countries as an array of objects, sorted by localized name.
 * @param locale - The locale for country names (defaults to 'en')
 * @returns Array of country objects with code, name, and flag
 *
 * @example
 * getAllCountries('en') // Returns [{ code: 'AD', name: 'Andorra', flag: '🇦🇩' }, ...]
 */
export function getAllCountries(
  locale: string = 'en'
): Array<{ code: string; name: string; flag: string }> {
  try {
    const lang = locale.split('-')[0] || 'en';
    const countryObj = countries.getNames(lang as any);

    return Object.entries(countryObj)
      .map(([code, name]) => ({
        code,
        name: name as string,
        flag: countryCodeToFlag(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  } catch (error) {
    console.warn(`Failed to get all countries for locale ${locale}:`, error);
    return [];
  }
}

/**
 * Search countries by name
 * @param query - Search query
 * @param locale - The locale for country names (defaults to 'en')
 * @returns Array of matching country objects
 *
 * @example
 * searchCountries('germ', 'en') // Returns [{ code: 'DE', name: 'Germany', flag: '🇩🇪' }]
 */
export function searchCountries(
  query: string,
  locale: string = 'en'
): Array<{ code: string; name: string; flag: string }> {
  const allCountries = getAllCountries(locale);
  const searchTerm = query.toLowerCase();

  return allCountries.filter(
    country =>
      country.name.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm)
  );
}
