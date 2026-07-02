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

/** First browser language that is a supported locale, else undefined. */
export function matchBrowserLocale(
  acceptLanguage?: string | null
): string | undefined {
  for (const lang of parseAcceptLanguage(acceptLanguage)) {
    if (hasLocale(routing.locales, lang)) return lang;
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
  if (hasLocale(routing.locales, input.cookieLocale)) {
    return input.cookieLocale;
  }
  return matchBrowserLocale(input.acceptLanguage) ?? routing.defaultLocale;
}
