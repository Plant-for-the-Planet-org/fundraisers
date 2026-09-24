import { create } from 'zustand';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
import { readCookie, writeCookie } from '@/i18n/locale-cookie';
import { currentUrlInLocale } from '@/i18n/localized-paths';
import { serializeLocaleCookieValue } from '@/i18n/resolve-locale';

type LocaleStore = {
  /** Switches the UI language. Rejects when a signed-in user's profile could not be saved; the language then stays as it was. */
  setLocale: (locale: string) => Promise<void>;
};

// The `ui-locale` cookie is what the server reads (i18n/request.ts); there is no localStorage mirror.
// When signed in, the profile language wins (see LocaleProfileSync), so a pick is saved to the profile first. Otherwise the next profile sync would undo it.
/* To read the current locale, use next-intl's `useLocale()` hook. */
export const useLocaleStore = create<LocaleStore>()(() => ({
  setLocale: async (newLocale: string) => {
    // A staffer's pick must not change the profile of the user they are impersonating.
    if (!useImpersonationStore.getState().isActive) {
      await useAuthStore.getState().updateProfileLocale(newLocale);
    }

    const value = serializeLocaleCookieValue(newLocale, 'explicit');
    writeCookie('ui-locale', value, 365);
    // Compare the exact value, not just presence: a stale cookie from a previous locale would otherwise look like a successful write, and reloading would change nothing.
    if (readCookie('ui-locale') !== value) {
      console.warn(
        '[i18n] ui-locale cookie write failed, locale change not persisted'
      );
      return;
    }

    // Localized pages have their own URL per language (`/explore`, `/de/explore`); other pages reload to pick up the cookie.
    const nextUrl = currentUrlInLocale(newLocale);
    if (nextUrl === `${window.location.pathname}${window.location.search}`) {
      window.location.reload();
    } else {
      window.location.assign(nextUrl);
    }
  },
}));
