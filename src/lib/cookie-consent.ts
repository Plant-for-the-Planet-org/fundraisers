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

  /**
   * Grant consent for a single category in one click, without opening the
   * preferences modal. Used by a gated embed's "allow" button: the button is
   * itself the clear, informed, affirmative consent action. Existing accepted
   * categories are preserved (we accept the union), so this never silently
   * revokes a prior choice such as analytics.
   */
  async accept(category: string): Promise<void> {
    const lib = await getCookieConsent();
    if (!lib) return;
    const accepted = new Set(lib.getUserPreferences().acceptedCategories ?? []);
    accepted.add(category);
    lib.acceptCategory([...accepted]);
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
