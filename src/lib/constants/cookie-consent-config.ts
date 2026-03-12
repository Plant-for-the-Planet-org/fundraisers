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
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: 'box',
      position: 'right',
      equalWeightButtons: true,
      flipButtons: false,
    },
  },
  categories: {
    [COOKIE_CATEGORIES.NECESSARY]: {
      readOnly: true,
      enabled: true,
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
