'use client';

import type { ProfilePaymentMethod } from '@/lib/api/user-service';

import { useEffect, useState } from 'react';
import { userService } from '@/lib/api/user-service';
import { useAuthStore } from '@/stores/auth-store';

// Only card and SEPA saved methods can be reused as a donation source today —
// other types (e.g. PayPal) are filtered out before reaching the UI.
const REUSABLE_TYPES = new Set<ProfilePaymentMethod['type']>([
  'card',
  'sepa_debit',
]);

interface UseSavedPaymentMethodsResult {
  savedMethods: ProfilePaymentMethod[];
  /**
   * Indicates whether saved payment methods are ready.
   *
   * Guests are ready immediately.
   * Authenticated users are ready after the fetch completes.
   */
  savedMethodsReady: boolean;
}

interface SettledFetch {
  /** Identity of the inputs that produced this result. */
  key: string;
  methods: ProfilePaymentMethod[];
}

function makeRequestKey(token: string, country: string): string {
  return `${token}|${country}`;
}

/**
 * Fetches reusable saved payment methods for the authenticated user.
 *
 * Returns an empty list for guests or failed requests since saved methods
 * are optional and should never block donations.
 */
export function useSavedPaymentMethods(
  country: string | undefined
): UseSavedPaymentMethodsResult {
  const token = useAuthStore(state => state.accessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Store fetched methods together with their request key so we can verify
  // they still belong to the current session.
  const [settled, setSettled] = useState<SettledFetch | null>(null);

  const eligible = isAuthenticated && !!token && !!country;
  const expectedKey = eligible ? makeRequestKey(token, country) : null;

  useEffect(() => {
    if (!eligible) return;

    const key = makeRequestKey(token, country);
    let cancelled = false;

    userService
      .getPaymentMethods(token, country)
      .then(methods => {
        if (cancelled) return;
        setSettled({
          key,
          methods: methods.filter(m => REUSABLE_TYPES.has(m.type)),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSettled({ key, methods: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [token, country, eligible]);

  // Only expose methods that belong to the current request.
  const isFresh = settled !== null && settled.key === expectedKey;

  return {
    savedMethods: isFresh ? settled.methods : [],
    savedMethodsReady: eligible ? isFresh : true,
  };
}
