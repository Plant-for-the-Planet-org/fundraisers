'use client';

import type { PaymentOptions } from '@/lib/types/payment-options';

import { useEffect, useState } from 'react';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { useAuthStore } from '@/stores/auth-store';

interface UsePaymentOptionsArgs {
  initialPaymentOptions: PaymentOptions;
  fetchEnabled?: boolean;
  areInitialOptionsAuthenticated?: boolean;
}

interface UsePaymentOptionsResult {
  paymentOptions: PaymentOptions;
  /**
   * `true` once `paymentOptions` reflects the user's auth state:
   * - fetch disabled → ready immediately (no fetch coming).
   * - anonymous user → ready immediately (no fetch coming).
   * - authenticated, server-side data already authenticated → ready immediately.
   * - authenticated, client-side fetch resolved (success or error) → ready.
   *
   * Consumers that read auth-protected fields like `lastPaymentMethod`
   * should defer the read until `isReady` is `true` to avoid showing the
   * pre-auth value and then shifting once the fetch resolves.
   */
  isReady: boolean;
}

interface PaymentOptionsCache {
  fundraiserId: string;
  paymentOptions: PaymentOptions;
  token: string;
}

export function usePaymentOptions(
  fundraiserId: string,
  {
    initialPaymentOptions,
    fetchEnabled = true,
    areInitialOptionsAuthenticated = false,
  }: UsePaymentOptionsArgs
): UsePaymentOptionsResult {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  const [cache, setCache] = useState<PaymentOptionsCache | null>(null);
  const [isFetchSettled, setIsFetchSettled] = useState(false);

  const isCacheValid =
    accessToken !== null &&
    cache?.fundraiserId === fundraiserId &&
    cache.token === accessToken;
  const hasAuthenticatedData =
    (areInitialOptionsAuthenticated && accessToken !== null) || isCacheValid;
  const paymentOptions = isCacheValid
    ? cache.paymentOptions
    : initialPaymentOptions;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFetchSettled(false);
  }, [fundraiserId, accessToken]);

  useEffect(() => {
    if (!fetchEnabled) return;
    if (isAuthInitializing || !accessToken || hasAuthenticatedData) return;

    let cancelled = false;

    getPaymentOptions(fundraiserId, { token: accessToken })
      .then(nextPaymentOptions => {
        if (cancelled) return;
        setCache({
          fundraiserId,
          paymentOptions: nextPaymentOptions,
          token: accessToken,
        });
        setIsFetchSettled(true);
      })
      .catch(error => {
        if (cancelled) return;
        console.error('[payment-options] auth fetch', error);
        // Mark settled even on failure so consumers don't wait forever.
        setIsFetchSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    fetchEnabled,
    fundraiserId,
    hasAuthenticatedData,
    areInitialOptionsAuthenticated,
    isAuthInitializing,
  ]);

  const isReady =
    !isAuthInitializing &&
    (!fetchEnabled ||
      !isAuthenticated ||
      hasAuthenticatedData ||
      isFetchSettled);

  return { paymentOptions, isReady };
}
