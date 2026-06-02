'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getFundraiserAuthenticated } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { buildTheme } from '@/lib/theme/build-theme';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

export function FundraiserAuthRetry({ slug }: { slug: string }) {
  const accessToken = useAuthStore(s => s.accessToken);
  const isAuthInitializing = useAuthStore(s => s.isAuthInitializing);
  const setSelectedTheme = useThemeStore(s => s.setSelectedTheme);
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<
    PaymentOptions | undefined
  >(undefined);
  const [failed, setFailed] = useState(false);

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
      .catch(() => setFailed(true));
  }, [isAuthInitializing, accessToken, slug, setSelectedTheme]);

  if (failed) notFound();
  if (!fundraiser) return null;

  return (
    <FundraiserView
      fundraiser={fundraiser}
      paymentOptions={paymentOptions}
      paymentOptionsAreAuthenticated={accessToken !== null}
      leaderboardFetchStrategy='client'
    />
  );
}
