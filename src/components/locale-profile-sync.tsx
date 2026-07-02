'use client';

import { useEffect } from 'react';
import { hasLocale, useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useLocaleStore } from '@/stores/locale-store';
import { routing } from '@/i18n/routing';

function hasUiLocaleCookie() {
  return (
    typeof document !== 'undefined' &&
    /(?:^|;\s*)ui-locale=/.test(document.cookie)
  );
}

/**
 * Seeds the UI locale from the authenticated user's saved profile locale — but
 * only when the user has no explicit preference yet (no `ui-locale` cookie).
 *
 * This makes the profile a *user preference* signal (top priority), while an
 * explicit language choice via the selector — which writes the cookie — always
 * wins, since the cookie short-circuits this effect. Runs after auth settles, so
 * `setLocale()`'s reload never interrupts the login flow.
 */
export function LocaleProfileSync() {
  const currentLocale = useLocale();
  const profileLocale = useAuthStore(state => state.user?.profile?.locale);
  const setLocale = useLocaleStore(state => state.setLocale);

  useEffect(() => {
    if (!profileLocale) return;
    if (hasUiLocaleCookie()) return; // explicit / prior preference wins
    if (!hasLocale(routing.locales, profileLocale)) return;
    if (profileLocale === currentLocale) return; // already correct
    setLocale(profileLocale); // writes cookie + reloads to load translations
  }, [profileLocale, currentLocale, setLocale]);

  return null;
}
