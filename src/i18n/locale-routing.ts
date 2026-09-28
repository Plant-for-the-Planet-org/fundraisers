import type { Locale } from './routing';

import {
  isLocalizedPath,
  localizePath,
  splitLocalePrefix,
} from './localized-paths';
import { normalizeToLocale, parseLocaleCookieValue } from './resolve-locale';
import { routing } from './routing';

export type LocaleRoute =
  /** Send the browser to another URL. */
  | { type: 'redirect'; pathname: string }
  /** Serve `pathname` in `locale`, keeping the URL the browser asked for. */
  | { type: 'rewrite'; pathname: string; locale: Locale }
  /** Serve as is. `locale` is set when the URL fixes the language, and left out when the cookie or browser decides. */
  | { type: 'next'; locale?: Locale };

/**
 * Decides, from the URL and the `ui-locale` cookie, how the proxy handles a request.
 *
 * On localized pages the URL fixes the language, so every URL always shows the same language, whoever asks for it.
 * The one exception: an unprefixed localized URL redirects to its German version when the cookie says German, so old links and emails still open in the language the visitor chose.
 */
export function routeLocale(input: {
  pathname: string;
  cookieLocale?: string | null;
}): LocaleRoute {
  const { locale: prefix, pathname } = splitLocalePrefix(input.pathname);

  if (prefix) {
    // `/en/explore` and `/de/raise/x` have no page of their own.
    if (prefix === routing.defaultLocale || !isLocalizedPath(pathname)) {
      return { type: 'redirect', pathname };
    }
    return { type: 'rewrite', pathname, locale: prefix };
  }

  if (!isLocalizedPath(pathname)) return { type: 'next' };

  const saved = normalizeToLocale(
    parseLocaleCookieValue(input.cookieLocale).locale
  );
  if (saved && saved !== routing.defaultLocale) {
    return { type: 'redirect', pathname: localizePath(pathname, saved) };
  }
  return { type: 'next', locale: routing.defaultLocale };
}

/** Request header the proxy uses to pass the URL's locale to `i18n/request.ts`. */
export const URL_LOCALE_HEADER = 'x-url-locale';
