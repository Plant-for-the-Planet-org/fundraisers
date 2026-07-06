import { create } from 'zustand';
import { readCookie, writeCookie } from '@/i18n/locale-cookie';
import { serializeLocaleCookieValue } from '@/i18n/resolve-locale';
import { routing } from '@/i18n/routing';

type LocaleStore = {
  locale: string;
  setLocale: (locale: string) => void;
};

// The `ui-locale` cookie is the single source of truth for locale (read
// server-side in i18n/request.ts); there is no localStorage mirror. Explicit
// selections here always win over a profile-synced value — see
// i18n/resolve-locale.ts for the `.explicit` / `.profile` tag scheme.
/* You only need `useLocaleStore` when you want to *change* the locale (via `setLocale()`). For just *reading* the current locale, use next-intl's `useLocale()` hook. */
export const useLocaleStore = create<LocaleStore>()(set => ({
  locale: routing.defaultLocale,
  setLocale: (newLocale: string) => {
    const value = serializeLocaleCookieValue(newLocale, 'explicit');
    writeCookie('ui-locale', value, 365);
    // Only commit the change if the cookie was saved successfully (compare
    // the exact value, not just presence — a stale cookie from a previous
    // locale would otherwise look like a successful write). Otherwise the
    // store would report a locale the server never renders (stuck UI, no
    // reload) and LocaleProfileSync could keep retrying indefinitely.
    if (readCookie('ui-locale') === value) {
      set({ locale: newLocale });
      window.location.reload(); // Refresh to load new translations
    } else {
      console.warn(
        '[i18n] ui-locale cookie write failed, locale change not persisted'
      );
    }
  },
}));
