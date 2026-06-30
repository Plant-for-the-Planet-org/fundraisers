'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { COOKIE_CONSENT_CONFIG } from '@/lib/constants/cookie-consent-config';

/**
 * Initializes vanilla-cookieconsent on mount.
 * Renders nothing — purely a side-effect provider.
 * Place once near the root of your app (e.g. in _app.tsx or a layout).
 */
export function CookieConsentProvider(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.endsWith('/stage')) return;
    import('vanilla-cookieconsent')
      .then(cc => {
        cc.run({
          ...COOKIE_CONSENT_CONFIG,

          // analytics hooks commented out — no service wired up yet.
          // onConsent: () => {
          //   if (cc.acceptedCategory('analytics')) {
          //     import('@/lib/analytics').then(({ initializeAnalytics }) => {
          //       initializeAnalytics();
          //     });
          //   }
          // },
          // onChange: ({ changedCategories }) => {
          //   if (changedCategories.includes('analytics')) {
          //     if (cc.acceptedCategory('analytics')) {
          //       import('@/lib/analytics').then(({ initializeAnalytics }) => {
          //         initializeAnalytics();
          //       });
          //     }
          //   }
          // },
        });
      })
      .catch(err => {
        console.error('[CookieConsent] Failed to load cookie consent:', err);
      });
  }, []);

  return null;
}
