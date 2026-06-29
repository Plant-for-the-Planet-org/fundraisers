'use client';

import { useEffect, useState } from 'react';
import { cookieConsent } from '@/lib/cookie-consent';

/**
 * Reactively tracks whether the visitor has accepted a given cookie-consent
 * category. Re-renders when consent changes: vanilla-cookieconsent dispatches
 * `cc:onConsent` (initial decision) and `cc:onChange` (later edits) as
 * CustomEvents on `window`.
 *
 * Defaults to `false` (fail-closed) until the client confirms consent, so
 * server-rendered output shows the non-consented state.
 */
export function useConsent(category: string): boolean {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let active = true;

    const sync = () => {
      cookieConsent.accepted(category).then(value => {
        if (active) setAccepted(value);
      });
    };

    sync();
    window.addEventListener('cc:onConsent', sync);
    window.addEventListener('cc:onChange', sync);

    return () => {
      active = false;
      window.removeEventListener('cc:onConsent', sync);
      window.removeEventListener('cc:onChange', sync);
    };
  }, [category]);

  return accepted;
}
