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
    set({ locale: newLocale });
    setCookie('ui-locale', newLocale, 365);
    // Reload only if the cookie was saved successfully. Otherwise,
    // LocaleProfileSync could keep triggering reloads indefinitely.
    if (cookieExists('ui-locale')) {
      window.location.reload(); // Refresh to load new translations
    }
  },
}));
