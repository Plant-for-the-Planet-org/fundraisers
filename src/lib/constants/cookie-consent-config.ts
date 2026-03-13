import type { CookieConsentConfig } from 'vanilla-cookieconsent';

import en from '../../../locales/en/cookie.json';
import de from '../../../locales/de/cookie.json';

export const COOKIE_CATEGORIES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics',
} as const;

export const COOKIE_CONSENT_CONFIG: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: 'box wide',
      position: 'bottom left',
      equalWeightButtons: false,
      flipButtons: true,
    },
    preferencesModal: {
      layout: 'box',
      position: 'right',
      equalWeightButtons: false,
      flipButtons: true,
    },
  },
  categories: {
    [COOKIE_CATEGORIES.NECESSARY]: {
      readOnly: true,
      enabled: true,
      services: {
        locale: {
          label: 'Language Preference (ui-locale)',
          cookies: [{ name: 'ui-locale' }],
        },
      },
    },

    [COOKIE_CATEGORIES.ANALYTICS]: {
      enabled: false,
    },
  },
  language: {
    default: 'en',
    autoDetect: 'document',
    translations: {
      en,
      de,
    },
  },
};
