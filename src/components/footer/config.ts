const BASE_URL = 'https://www.plant-for-the-planet.org';

export const FOOTER_LINK_FALLBACK_LOCALE = 'en';

type FooterLinkLabelKey = 'privacy' | 'terms' | 'imprint';

type FooterLink = {
  labelKey: FooterLinkLabelKey;
  hrefByLocale: Record<string, string> & {
    [FOOTER_LINK_FALLBACK_LOCALE]: string;
  };
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
] as const;

export function getFooterLinkHref(link: FooterLink, locale: string): string {
  return (
    link.hrefByLocale[locale] ?? link.hrefByLocale[FOOTER_LINK_FALLBACK_LOCALE]
  );
}
