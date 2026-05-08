'use client';

import type { PaymentOptions } from '@/lib/types/payment-options';

import { useEffect, useState } from 'react';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { useAuthStore } from '@/stores/auth-store';

interface UsePaymentOptionsArgs {
  initialPaymentOptions: PaymentOptions;
  enabled?: boolean;
  includeAuthenticatedData?: boolean;
  initialPaymentOptionsAreAuthenticated?: boolean;
}

interface UsePaymentOptionsResult {
  paymentOptions: PaymentOptions;
  /**
   * `true` once `paymentOptions` reflects the user's auth state:
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

interface AuthenticatedPaymentOptionsState {
  fundraiserId: string;
  paymentOptions: PaymentOptions;
  token: string;
}

export function usePaymentOptions(
  fundraiserId: string,
  {
    initialPaymentOptions,
    enabled = true,
    includeAuthenticatedData = false,
    initialPaymentOptionsAreAuthenticated = false,
  }: UsePaymentOptionsArgs
): UsePaymentOptionsResult {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const [authenticatedState, setAuthenticatedState] =
    useState<AuthenticatedPaymentOptionsState | null>(null);
  const [authFetchSettled, setAuthFetchSettled] = useState(false);

  const isAuthenticatedStateCurrent =
    !!accessToken &&
    authenticatedState?.fundraiserId === fundraiserId &&
    authenticatedState.token === accessToken;
  const hasAuthenticatedData =
    (initialPaymentOptionsAreAuthenticated && !!accessToken) ||
    isAuthenticatedStateCurrent;
  const paymentOptions = isAuthenticatedStateCurrent
    ? authenticatedState.paymentOptions
    : initialPaymentOptions;

  // Reset the settled flag when the inputs that drive the fetch change.
  useEffect(() => {
    setAuthFetchSettled(false);
  }, [fundraiserId, accessToken]);

  useEffect(() => {
    if (!enabled || !includeAuthenticatedData) return;
    if (isAuthInitializing || !accessToken || hasAuthenticatedData) {
      return;
    }

    let cancelled = false;

    getPaymentOptions(fundraiserId, { token: accessToken })
      .then(nextPaymentOptions => {
        if (cancelled) return;
        setAuthenticatedState({
          fundraiserId,
          paymentOptions: nextPaymentOptions,
          token: accessToken,
        });
        setAuthFetchSettled(true);
      })
      .catch(error => {
        if (cancelled) return;
        console.error('[payment-options] auth fetch', error);
        // Mark settled even on failure so consumers don't wait forever.
        setAuthFetchSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    enabled,
    fundraiserId,
    hasAuthenticatedData,
    includeAuthenticatedData,
    initialPaymentOptionsAreAuthenticated,
    isAuthInitializing,
  ]);

  const isReady =
    !isAuthInitializing &&
    (!includeAuthenticatedData ||
      !accessToken ||
      hasAuthenticatedData ||
      authFetchSettled);

  return { paymentOptions, isReady };
}
