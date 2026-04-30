'use client';

import type { PaymentOptions } from '@/lib/types/payment-options';

import { useEffect, useState } from 'react';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { useAuthStore } from '@/stores/auth-store';

interface UsePaymentOptionsOptions {
  initialPaymentOptions: PaymentOptions;
  enabled?: boolean;
  includeAuthenticatedData?: boolean;
  initialPaymentOptionsAreAuthenticated?: boolean;
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
  }: UsePaymentOptionsOptions
): PaymentOptions {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const [authenticatedState, setAuthenticatedState] =
    useState<AuthenticatedPaymentOptionsState | null>(null);
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
      })
      .catch(error => {
        if (!cancelled) {
          console.error('[payment-options] auth fetch', error);
        }
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

  return paymentOptions;
}
