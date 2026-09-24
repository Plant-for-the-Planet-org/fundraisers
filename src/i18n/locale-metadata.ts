import type { Metadata } from 'next';
import type { Locale } from './routing';

import { hasLocale } from 'next-intl';
import { localizePath } from './localized-paths';
import { routing } from './routing';

const OG_LOCALES: Record<Locale, string> = { en: 'en_US', de: 'de_DE' };

function ogLocale(locale: string): string {
  return hasLocale(routing.locales, locale) ? OG_LOCALES[locale] : locale;
}

/**
 * Canonical, hreflang and og:locale tags for a page that has one URL per language.
 * `x-default` points at the English URL, which is what visitors with no saved language get.
 */
export function localizedPageMetadata(
  pathname: string,
  locale: string
): {
  alternates: NonNullable<Metadata['alternates']>;
  openGraph: { locale: string; alternateLocale: string[] };
} {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map(l => [l, localizePath(pathname, l)])
  );
  languages['x-default'] = localizePath(pathname, routing.defaultLocale);

  return {
    alternates: { canonical: localizePath(pathname, locale), languages },
    openGraph: {
      locale: ogLocale(locale),
      alternateLocale: routing.locales.filter(l => l !== locale).map(ogLocale),
    },
  };
}
