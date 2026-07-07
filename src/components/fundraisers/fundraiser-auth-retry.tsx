'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getFundraiserAuthenticated } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { buildTheme } from '@/lib/theme/build-theme';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { FundraiserLoadingSkeleton } from '@/components/fundraisers/fundraiser-loading-skeleton';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

export function FundraiserAuthRetry({ slug }: { slug: string }) {
  const accessToken = useAuthStore(s => s.accessToken);
  const isAuthInitializing = useAuthStore(s => s.isAuthInitializing);
  const setSelectedTheme = useThemeStore(s => s.setSelectedTheme);
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<
    PaymentOptions | undefined
  >(undefined);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (isAuthInitializing || !accessToken) return;

    getFundraiserAuthenticated(slug, accessToken)
      .then(async data => {
        setSelectedTheme(buildTheme(data.settings?.theme ?? null));
        let options: PaymentOptions | undefined;
        if (data.canDonate) {
          try {
            options = await getPaymentOptions(data.id, { token: accessToken });
          } catch {
            // payment options unavailable; donation form won't render
          }
        }
        setFundraiser(data);
        setPaymentOptions(options);
      })
      .catch(setError);
  }, [isAuthInitializing, accessToken, slug, setSelectedTheme]);

  if (error !== null) {
    // This is the terminal step of the retry page.tsx delegated to us: it rendered this component because the anonymous fetch got 401/403/404. If the authenticated fetch still returns an auth/not-found status, the user genuinely can't see this fundraiser → 404. Transient failures (500, timeout, network) instead surface through error.tsx with its retry.
    if (
      error instanceof PlatformAPIError &&
      [401, 403, 404, 405].includes(error.status)
    ) {
      notFound();
    }
    throw error;
  }
  // Auth finished with no token → treat as not found (drafts stay invisible to the public; a host can view after logging in).
  if (!isAuthInitializing && !accessToken) notFound();
  // Still initializing, or the authenticated fetch is in flight.
  if (!fundraiser) return <FundraiserLoadingSkeleton />;

  return (
    <FundraiserView
      fundraiser={fundraiser}
      paymentOptions={paymentOptions}
      paymentOptionsAreAuthenticated={accessToken !== null}
      leaderboardFetchStrategy='client'
    />
  );
}
