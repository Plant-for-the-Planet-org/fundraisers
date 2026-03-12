'use client';

import { COOKIE_CONSENT_CONFIG } from '@/lib/constants/cookie-consent-config';
import { useEffect } from 'react';

/**
 * Initializes vanilla-cookieconsent on mount.
 * Renders nothing — purely a side-effect provider.
 * Place once near the root of your app (e.g. in _app.tsx or a layout).
 */
export function CookieConsentProvider(): null {
  useEffect(() => {
    import('vanilla-cookieconsent')
      .then(cc => {
        cc.run({
          ...COOKIE_CONSENT_CONFIG,

          onConsent: () => {
            // Handle analytics consent
            if (cc.acceptedCategory('analytics')) {
              import('@/lib/analytics').then(({ initializeAnalytics }) => {
                initializeAnalytics();
              });
            }
          },

          onChange: ({ changedCategories }) => {
            // Handle category changes
            if (changedCategories.includes('analytics')) {
              if (cc.acceptedCategory('analytics')) {
                import('@/lib/analytics').then(({ initializeAnalytics }) => {
                  initializeAnalytics();
                });
              }
            }
          },
        });
      })
      .catch(err => {
        console.error('[CookieConsent] Failed to load cookie consent:', err);
      });
  }, []);

  return null;
}
