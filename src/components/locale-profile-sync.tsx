'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { deleteCookie, readCookie, writeCookie } from '@/i18n/locale-cookie';
import {
  normalizeToLocale,
  parseLocaleCookieValue,
  serializeLocaleCookieValue,
} from '@/i18n/resolve-locale';

/**
 * Keeps the `ui-locale` cookie's `.profile` tier in sync with the
 * authenticated user's saved profile locale, and refreshes the route to
 * apply it when nothing higher-priority is set.
 *
 * Priority (low to high): default < browser < profile < explicit selection.
 * Profile and explicit selection share one cookie (see
 * i18n/resolve-locale.ts) tagged `.profile` or `.explicit` — this effect
 * only ever writes the `.profile` tag and never overwrites an `.explicit`
 * one, so a manual language-switcher pick always sticks. It keeps syncing
 * on every profile load, not just once, so a later profile change still
 * takes effect. Gated on `isAuthInitializing` so it can't fire mid-login,
 * before auth settles.
 */
export function LocaleProfileSync() {
  const currentLocale = useLocale();
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const profileLocale = useAuthStore(state => state.user?.profile?.locale);

  // Normalize the profile locale (e.g. "en-US" -> "en") to match
  // supported locales, just like Accept-Language.
  const targetLocale = normalizeToLocale(profileLocale);

  useEffect(() => {
    if (isAuthInitializing) return;

    const { locale: cookieLocale, source } = parseLocaleCookieValue(
      readCookie('ui-locale')
    );

    if (!targetLocale) {
      // No (valid) profile locale — e.g. logged out, or profile locale is
      // empty/unsupported. Clear the cookie only if we're the ones who set
      // it; never touch an explicit pick.
      if (cookieLocale && source === 'profile') deleteCookie('ui-locale');
      return;
    }

    // Only an actual stored explicit pick wins — `source` defaults to
    // 'explicit' even when there's no cookie at all (see
    // parseLocaleCookieValue), so this must also check a value is present.
    if (cookieLocale && source === 'explicit') return;
    if (targetLocale === currentLocale) return; // already correct

    const value = serializeLocaleCookieValue(targetLocale, 'profile');
    writeCookie('ui-locale', value, 365);
    if (readCookie('ui-locale') === value) {
      // Full reload, not router.refresh(): refresh only re-renders server components — client components keep the messages they hydrated with,leaving a mixed-language UI. A reload re-resolves both against the new cookie.
      window.location.reload();
    } else {
      console.warn(
        '[i18n] profile-locale cookie write failed, locale change not persisted'
      );
    }
  }, [isAuthInitializing, targetLocale, currentLocale]);

  return null;
}
