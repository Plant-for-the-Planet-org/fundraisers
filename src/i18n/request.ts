import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale (awaited because it's async)
  const requested = await requestLocale;

  // Validate and fallback to default if invalid
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../../locales/${locale}/common.json`)).default,
    },
  };
});
