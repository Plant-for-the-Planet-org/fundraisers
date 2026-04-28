'use client';

import type { PaymentOptions } from '@/lib/types/payment-options';

import { useEffect, useState } from 'react';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { useAuthStore } from '@/stores/auth-store';

export function useAuthenticatedPaymentOptions(
  fundraiserId: string
): PaymentOptions | null {
  const accessToken = useAuthStore(s => s.accessToken);
  const isAuthInitializing = useAuthStore(s => s.isAuthInitializing);
  const [data, setData] = useState<PaymentOptions | null>(null);

  useEffect(() => {
    if (isAuthInitializing || !accessToken) return;

    let cancelled = false;
    getPaymentOptions(fundraiserId, accessToken)
      .then(options => {
        if (cancelled) return;
        setData(options);
      })
      .catch(error => {
        if (!cancelled) console.error('[payment-options] auth fetch', error);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthInitializing, accessToken, fundraiserId]);

  return data;
}
