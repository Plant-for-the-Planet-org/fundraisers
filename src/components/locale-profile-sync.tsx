'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
import { readCookie, writeCookie } from '@/i18n/locale-cookie';
import { splitLocalePrefix } from '@/i18n/localized-paths';
import {
  normalizeToLocale,
  parseLocaleCookieValue,
  serializeLocaleCookieValue,
} from '@/i18n/resolve-locale';

/**
 * Keeps the `ui-locale` cookie in sync with the signed-in user's profile language, and reloads to apply it.
 *
 * Priority (low to high): default < browser < saved pick < profile.
 * The profile wins because a signed-in pick is saved to the profile too (see locale-store.ts), so the two only differ when the profile changed somewhere else.
 * It keeps syncing on every profile load, not just once, so a later profile change still takes effect.
 * Gated on `isAuthInitializing` so it can't fire mid-login, before auth settles, and skipped while impersonating, so a staffer keeps their own language.
 */
export function LocaleProfileSync() {
  const currentLocale = useLocale();
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const profileLocale = useAuthStore(state => state.user?.profile?.locale);
  const isImpersonating = useImpersonationStore(state => state.isActive);

  // Normalize the profile locale (e.g. "en-US" -> "en") to match
  // supported locales, just like Accept-Language.
  const targetLocale = normalizeToLocale(profileLocale);

  useEffect(() => {
    if (isAuthInitializing || isImpersonating) return;
    // No (valid) profile locale to apply — e.g. logged out, or profile locale is empty/unsupported. Leave any existing cookie in place; a logout keeps the last profile-synced language rather than reverting it.
    if (!targetLocale) return;

    const { locale: cookieLocale } = parseLocaleCookieValue(
      readCookie('ui-locale')
    );

    // Also the loop guard: once the cookie carries the target, a reload has already happened or was not needed. currentLocale can lag (e.g. a failed/partial render leaving the client on the default locale), so it must not drive another reload.
    if (cookieLocale === targetLocale) return;

    const value = serializeLocaleCookieValue(targetLocale, 'profile');
    writeCookie('ui-locale', value, 365);
    if (readCookie('ui-locale') !== value) {
      console.warn(
        '[i18n] profile-locale cookie write failed, locale change not persisted'
      );
      return;
    }

    if (targetLocale === currentLocale) return;
    // A URL like `/de/explore` fixes the language for that page, so a reload would change nothing. The cookie still applies from the next page on.
    if (splitLocalePrefix(window.location.pathname).locale) return;
    // Full reload, not router.refresh(): refresh only re-renders server components — client components keep the messages they hydrated with, leaving a mixed-language UI. A reload re-resolves both against the new cookie.
    window.location.reload();
  }, [isAuthInitializing, isImpersonating, targetLocale, currentLocale]);

  return null;
}
