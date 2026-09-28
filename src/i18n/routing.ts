import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  // next-intl's middleware is not used. Our own proxy (src/proxy.ts) serves `/de/...` for the pages listed in i18n/localized-paths.ts; every other page has no prefix.
  localePrefix: 'never',
  // Browser detection happens server-side in i18n/resolve-locale.ts, which reads Accept-Language directly.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
