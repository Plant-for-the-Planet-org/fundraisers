import type { Locale } from './routing';

import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Public pages that have their own URL per language: English at `/explore`, German at `/de/explore`.
 * Only pages written in our own words belong here. Fundraiser pages stay on one URL, because their content is written once, in one language.
 */
export function isLocalizedPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/explore' ||
    pathname.startsWith('/explore/')
  );
}

/** Splits `/de/explore` into `{ locale: 'de', pathname: '/explore' }`. A path with no locale prefix comes back unchanged. */
export function splitLocalePrefix(pathname: string): {
  locale?: Locale;
  pathname: string;
} {
  const [, first, ...rest] = pathname.split('/');
  if (!first || !hasLocale(routing.locales, first)) return { pathname };
  return { locale: first, pathname: `/${rest.join('/')}` };
}

/** The URL of a page in a given language. Paths that are not localized, and the default locale, have no prefix. */
export function localizePath(pathname: string, locale: string): string {
  const { pathname: bare } = splitLocalePrefix(pathname);
  if (locale === routing.defaultLocale || !isLocalizedPath(bare)) return bare;
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}

/** Like `localizePath`, for an href that may carry a query string or hash. */
export function localizeHref(href: string, locale: string): string {
  if (!href.startsWith('/')) return href;
  const cut = href.search(/[?#]/);
  const pathname = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? '' : href.slice(cut);
  return `${localizePath(pathname, locale)}${rest}`;
}

/** The URL of the same page in another language, keeping the query string. For use in the browser only. */
export function currentUrlInLocale(locale: string): string {
  const { pathname, search } = window.location;
  return `${localizePath(pathname, locale)}${search}`;
}
