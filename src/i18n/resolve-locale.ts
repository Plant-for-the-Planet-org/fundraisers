import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Parse an Accept-Language header into primary language subtags, most-preferred
 * first, honoring q-weights.
 *
 *   "de-DE,de;q=0.9,en-US;q=0.8,*;q=0.5" -> ["de", "de", "en"]
 */
export function parseAcceptLanguage(header?: string | null): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map(part => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.map(p => p.trim()).find(p => p.startsWith('q='));
      const weight = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return {
        tag: tag.trim().toLowerCase(),
        weight: Number.isNaN(weight) ? 0 : weight,
      };
    })
    .filter(item => item.tag && item.tag !== '*')
    .sort((a, b) => b.weight - a.weight)
    .map(item => item.tag.split('-')[0]); // primary subtag only
}

/**
 * Converts locale values like "en-US" to "en" and returns undefined
 * for unsupported locales.
 */
export function normalizeToLocale(tag?: string | null): string | undefined {
  const primary = tag?.trim().toLowerCase().split('-')[0];
  return primary && hasLocale(routing.locales, primary) ? primary : undefined;
}

/** First browser language that is a supported locale, else undefined. */
export function matchBrowserLocale(
  acceptLanguage?: string | null
): string | undefined {
  for (const lang of parseAcceptLanguage(acceptLanguage)) {
    const locale = normalizeToLocale(lang);
    if (locale) return locale;
  }
  return undefined;
}

/**
 * Resolve the UI locale by priority:
 *   1. user preference (the `ui-locale` cookie)
 *   2. browser language (Accept-Language) if it maps to a supported locale
 *   3. default locale
 *
 * Kept free of `next/headers` so it stays pure and unit-testable — the caller
 * (i18n/request.ts) reads the cookie + header and passes the values in.
 */
export function resolveLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): string {
  return (
    normalizeToLocale(input.cookieLocale) ??
    matchBrowserLocale(input.acceptLanguage) ??
    routing.defaultLocale
  );
}
