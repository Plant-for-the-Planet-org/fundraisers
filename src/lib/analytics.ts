'use client';

import { cookieConsent } from './cookie-consent';

/**
 * Initialize analytics services based on cookie consent
 * This should be called after cookie consent is loaded
 */
export async function initializeAnalytics() {
  if (await cookieConsent.accepted('analytics')) {
    // Sentry is already initialized server-side, but we can enable additional client-side features
    console.log('Analytics enabled - Sentry performance monitoring active');

    // You can add other analytics services here
    // Example: Google Analytics, Mixpanel, etc.
  } else {
    console.log('Analytics disabled - respecting user privacy preferences');
  }
}
