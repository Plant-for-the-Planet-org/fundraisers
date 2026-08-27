import countries from 'i18n-iso-countries';
import { getPlatformConfig } from '../api/config-service';

// Only reached when /config fails or cannot place the caller.
const LOCALE_COUNTRY: Record<string, string> = { de: 'DE', en: 'US' };
const FALLBACK_COUNTRY = 'DE';

/**
 * Best guess at the country to record on a new profile.
 *
 * The platform requires a country on every profile and we never ask the user for one at signup, so this always returns something.
 * A wrong guess is correctable later; a missing one fails the signup.
 */
export async function resolveSignupCountry(locale: string): Promise<string> {
  const config = await getPlatformConfig();
  const ipCountry = normalize(config?.country ?? config?.loc?.countryCode);

  return ipCountry ?? localeCountry(locale) ?? FALLBACK_COUNTRY;
}

function localeCountry(locale: string): string | null {
  return normalize(LOCALE_COUNTRY[locale.toLowerCase().split('-')[0]]);
}

/**
 * The platform validates this column, so a code it would reject fails the whole signup while the fallback succeeds.
 * `isValid` also covers the values the platform sends when it cannot place the caller (T1 for a Tor exit node, XX for unknown), so they need no special case.
 */
function normalize(code: string | undefined | null): string | null {
  const upper = code?.trim().toUpperCase();
  if (!upper || !countries.isValid(upper)) return null;
  return upper;
}
