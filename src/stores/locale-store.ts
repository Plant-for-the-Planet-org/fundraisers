import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LocaleStore = {
  locale: string;
  setLocale: (locale: string) => void;
};

// Helper to set cookie
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/* You only need `useLocaleStore` when you want to *change* the locale (via `setLocale()`). For just *reading* the current locale, use next-intl's `useLocale()` hook. */
export const useLocaleStore = create<LocaleStore>()(
  persist(
    set => ({
      locale: 'de', // Default
      setLocale: (newLocale: string) => {
        set({ locale: newLocale });
        setCookie('ui-locale', newLocale, 365);
        window.location.reload(); // Refresh to load new translations
      },
    }),
    {
      name: 'ui-locale', // localStorage key
    }
  )
);
