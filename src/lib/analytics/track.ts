type UmamiTracker = {
  track: (name: string, data?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/**
 * Sends a Umami custom event.
 *
 * Cookieless like the pageview it rides along with: nothing is written to or read
 * from the device. See docs/cookie-consent-stance.md.
 *
 * No-ops when the tracker is absent, which is every non-production host and any
 * visitor blocking the script. Never pass anything that identifies a person.
 */
export function trackEvent(name: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Measurement must never break the donation flow.
  }
}
