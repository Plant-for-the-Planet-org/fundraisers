const BASE_URL = 'https://www.plant-for-the-planet.org';

export const FOOTER_LINK_FALLBACK_LOCALE = 'en';

type FooterLinkLabelKey = 'privacy' | 'terms' | 'imprint' | 'cookies';

type FooterLink = {
  labelKey: FooterLinkLabelKey;
  hrefByLocale: Record<string, string> & {
    [FOOTER_LINK_FALLBACK_LOCALE]: string;
  };
  // Internal links point to a route in this app: render with next/link and no
  // new-tab behaviour. External links (the default) open on plant-for-the-planet.org.
  internal?: boolean;
};

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    labelKey: 'privacy',
    hrefByLocale: {
      en: `${BASE_URL}/privacy-policy`,
      de: `${BASE_URL}/de/privacy-terms/`,
    },
  },
  {
    labelKey: 'terms',
    hrefByLocale: {
      en: `${BASE_URL}/terms-of-service`,
      de: `${BASE_URL}/de/terms-and-conditions/`,
    },
  },
  {
    labelKey: 'imprint',
    hrefByLocale: {
      en: `${BASE_URL}/imprint`,
      de: `${BASE_URL}/de/imprint/`,
    },
  },
  {
    labelKey: 'cookies',
    internal: true,
    // localePrefix is 'never', so the path is the same in every locale.
    hrefByLocale: {
      en: '/cookies',
      de: '/cookies',
    },
  },
] as const;

export function getFooterLinkHref(link: FooterLink, locale: string): string {
  return (
    link.hrefByLocale[locale] ?? link.hrefByLocale[FOOTER_LINK_FALLBACK_LOCALE]
  );
}
