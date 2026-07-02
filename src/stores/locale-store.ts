import { create } from 'zustand';
import { routing } from '@/i18n/routing';

type LocaleStore = {
  locale: string;
  setLocale: (locale: string) => void;
};

// Helper to set cookie. The `ui-locale` cookie is the single source of truth for
// locale (read server-side in i18n/request.ts); there is no localStorage mirror.
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax`;
}

function cookieExists(name: string) {
  return new RegExp(`(?:^|;\\s*)${name}=`).test(document.cookie);
}

/* You only need `useLocaleStore` when you want to *change* the locale (via `setLocale()`). For just *reading* the current locale, use next-intl's `useLocale()` hook. */
export const useLocaleStore = create<LocaleStore>()(set => ({
  locale: routing.defaultLocale,
  setLocale: (newLocale: string) => {
    setCookie('ui-locale', newLocale, 365);
    // Only commit the change if the cookie was saved successfully. Otherwise
    // the store would report a locale the server never renders (stuck UI,
    // no reload) and LocaleProfileSync could keep retrying indefinitely.
    if (cookieExists('ui-locale')) {
      set({ locale: newLocale });
      window.location.reload(); // Refresh to load new translations
    } else {
      console.warn(
        '[i18n] ui-locale cookie write failed, locale change not persisted'
      );
    }
  },
}));
