'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useLocaleStore } from '@/stores/locale-store';
import { normalizeToLocale } from '@/i18n/resolve-locale';

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

  // Normalize the profile locale (e.g. "en-US" -> "en") to match
  // supported locales, just like Accept-Language.
  const targetLocale = normalizeToLocale(profileLocale);

  useEffect(() => {
    if (!targetLocale) return;
    if (hasUiLocaleCookie()) return; // explicit / prior preference wins
    if (targetLocale === currentLocale) return; // already correct
    setLocale(targetLocale); // writes cookie + reloads to load translations
  }, [targetLocale, currentLocale, setLocale]);

  return null;
}
