import type * as CookieConsent from 'vanilla-cookieconsent';

let cookieConsentPromise: Promise<typeof CookieConsent> | null = null;

async function getCookieConsent() {
  // Prevent SSR execution
  if (typeof window === 'undefined') return null;

  // Cache the import so it loads only once
  if (!cookieConsentPromise) {
    cookieConsentPromise = import('vanilla-cookieconsent');
  }

  return cookieConsentPromise;
}

export const cookieConsent = {
  async accepted(category: string): Promise<boolean> {
    const lib = await getCookieConsent();
    return lib?.acceptedCategory(category) ?? false;
  },

  async acceptedAny(categories: string[]): Promise<boolean> {
    const lib = await getCookieConsent();
    if (!lib) return false;

    return categories.some(cat => lib.acceptedCategory(cat));
  },

  async show(): Promise<void> {
    const lib = await getCookieConsent();
    lib?.show();
  },

  async showPreferences(): Promise<void> {
    const lib = await getCookieConsent();
    lib?.showPreferences();
  },

  async hide(): Promise<void> {
    const lib = await getCookieConsent();
    lib?.hide();
  },

  async reset(): Promise<void> {
    const lib = await getCookieConsent();
    lib?.reset();
  },
};
