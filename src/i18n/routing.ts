import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'de',
  localePrefix: 'never', // No /en or /de in URL
  localeDetection: false, // Don't use browser Accept-Language
});

export type Locale = (typeof routing.locales)[number];
