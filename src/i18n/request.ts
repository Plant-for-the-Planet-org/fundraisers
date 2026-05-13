import { cookies } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async () => {
  // Get locale from cookie (set by client)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('ui-locale')?.value;

  // Validate and fallback to default if invalid
  const locale = hasLocale(routing.locales, cookieLocale)
    ? cookieLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../../locales/${locale}/common.json`)).default,
      ...(await import(`../../locales/${locale}/explore.json`)).default,
      ...(await import(`../../locales/${locale}/fundraisers.json`)).default,
      ...(await import(`../../locales/${locale}/bundles.json`)).default,
      ...(await import(`../../locales/${locale}/auth.json`)).default,
      ...(await import(`../../locales/${locale}/dashboard.json`)).default,
      ...(await import(`../../locales/${locale}/donate.json`)).default,
      ...(await import(`../../locales/${locale}/leaderboard.json`)).default,
    },
  };
});
