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

/** Who set the current value of the `ui-locale` cookie. */
export type LocaleSource = 'explicit' | 'profile';

const LOCALE_SOURCE_SEPARATOR = '.';

/**
 * The `ui-locale` cookie holds both a locale and who set it, as
 * `<locale>.<source>` (e.g. `de.profile`, `en.explicit`) — one cookie, not
 * two, but still able to tell "the user picked this" from "this is what
 * their profile says" so a profile update can keep taking priority over
 * browser language without ever clobbering an explicit pick.
 *
 * Legacy cookies written before this tag existed have no separator — those
 * are treated as `explicit`, since that's the only thing they could have
 * meant (the cookie was only ever written by an explicit pick or an
 * old one-time profile seed, both of which should keep outranking a
 * fresh profile sync).
 */
export function parseLocaleCookieValue(raw?: string | null): {
  locale?: string;
  source: LocaleSource;
} {
  if (!raw) return { locale: undefined, source: 'explicit' };
  const [locale, source] = raw.split(LOCALE_SOURCE_SEPARATOR);
  return {
    locale: locale || undefined,
    source: source === 'profile' ? 'profile' : 'explicit',
  };
}

export function serializeLocaleCookieValue(
  locale: string,
  source: LocaleSource
): string {
  return `${locale}${LOCALE_SOURCE_SEPARATOR}${source}`;
}

/**
 * Resolve the UI locale by priority, low to high:
 *   1. default locale
 *   2. browser language (Accept-Language) if it maps to a supported locale
 *   3. user's profile language (`ui-locale` cookie, `.profile` tag)
 *   4. user's explicit selection (`ui-locale` cookie, `.explicit` tag)
 *
 * Tiers 3 and 4 share one cookie — whichever tag is stored is already the
 * winner between them, so the server only needs the locale value, never the
 * tag itself (the tag only matters client-side, to decide whether a profile
 * sync is allowed to overwrite the cookie).
 *
 * Kept free of `next/headers` so it stays pure and unit-testable — the caller
 * (i18n/request.ts) reads the cookie + header and passes the values in.
 */
export function resolveLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): string {
  const { locale } = parseLocaleCookieValue(input.cookieLocale);
  return (
    normalizeToLocale(locale) ??
    matchBrowserLocale(input.acceptLanguage) ??
    routing.defaultLocale
  );
}
