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
