import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // List of supported locales
  locales: ['en', 'de'],

  // Used when no locale matches
  defaultLocale: 'en',
});
