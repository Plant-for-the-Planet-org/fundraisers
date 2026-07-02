import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  localePrefix: 'never', // No /en or /de in URL
  // `localeDetection` toggles next-intl's *middleware* detection, which we don't
  // use (localePrefix is 'never'). Browser detection happens server-side in
  // i18n/resolve-locale.ts, which reads Accept-Language directly.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
