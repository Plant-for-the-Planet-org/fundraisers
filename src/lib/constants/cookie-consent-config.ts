import type { CookieConsentConfig } from 'vanilla-cookieconsent';

import deRaw from '../../../locales/de/cookie.json';
import enRaw from '../../../locales/en/cookie.json';

export const COOKIE_CATEGORIES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics',
  // Gates third-party media embeds that set their own cookies (e.g. YouTube).
  EXTERNAL_MEDIA: 'externalMedia',
} as const;

type PreferencesModalTranslation = Pick<typeof enRaw, 'preferencesModal'>;

function buildSections(t: PreferencesModalTranslation) {
  const sections = t.preferencesModal.sections;
  return [
    {
      title: sections.intro.title,
      description: sections.intro.description,
    },
    {
      title: sections.necessary.title,
      description: sections.necessary.description,
      linkedCategory: 'necessary',
    },
    {
      title: sections.analytics.title,
      description: sections.analytics.description,
      linkedCategory: 'analytics',
    },
    {
      title: sections.externalMedia.title,
      description: sections.externalMedia.description,
      linkedCategory: 'externalMedia',
    },
    {
      title: sections.moreInfo.title,
      description: sections.moreInfo.description,
    },
  ];
}

const en = {
  ...enRaw,
  preferencesModal: {
    ...enRaw.preferencesModal,
    sections: buildSections(enRaw),
  },
};

const de = {
  ...deRaw,
  preferencesModal: {
    ...deRaw.preferencesModal,
    sections: buildSections(deRaw),
  },
};

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

    [COOKIE_CATEGORIES.EXTERNAL_MEDIA]: {
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
