import { cookies } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { registeredModules } from '@/modules';
import { routing } from './routing';

// Namespaces owned by core (always loaded).
const CORE_NAMESPACES = [
  'common',
  'explore',
  'fundraisers',
  'bundles',
  'auth',
  'dashboard',
  'donate',
  'leaderboard',
  'cookies',
] as const;

// If a namespace file is missing, log a warning and skip it (return {}) instead of throwing.
// That way one missing file shows up as missing text, not a crashed page; the locale build check catches a missing file before it ships.
async function loadNamespace(locale: string, namespace: string) {
  try {
    return (await import(`../../locales/${locale}/${namespace}.json`)).default;
  } catch {
    console.warn(
      `[i18n] missing namespace "${namespace}" for locale "${locale}"`
    );
    return {};
  }
}

export default getRequestConfig(async () => {
  // Get locale from cookie (set by client)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('ui-locale')?.value;

  // Validate and fallback to default if invalid
  const locale = hasLocale(routing.locales, cookieLocale)
    ? cookieLocale
    : routing.defaultLocale;

  const moduleNamespaces = registeredModules
    .map(m => m.localeNamespace)
    .filter((ns): ns is string => Boolean(ns));

  const namespaces = [...CORE_NAMESPACES, ...moduleNamespaces];
  const loadedMessages = await Promise.all(
    namespaces.map(ns => loadNamespace(locale, ns))
  );

  return {
    locale,
    messages: Object.assign({}, ...loadedMessages),
  };
});
