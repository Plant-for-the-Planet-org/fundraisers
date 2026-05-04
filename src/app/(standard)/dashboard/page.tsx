'use client';

import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getDashboardSummary,
  getFundraisers,
} from '@/lib/api/fundraisers-service';
import { useAuthStore } from '@/stores/auth-store';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  DashboardHeader,
  DashboardSummary,
  FundraiserList,
} from '@/components/dashboard';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';

const EMPTY_SUMMARY: DashboardSummaryStats = {
  totalFundraiserCount: 0,
  activeFundraiserCount: 0,
  donationsCount: 0,
  totalRaisedByCurrency: [],
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const accessToken = useAuthStore(state => state.accessToken);

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchFundraisers = useCallback(
    async (signal?: { aborted: boolean }) => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const data = await getFundraisers(accessToken);
        if (signal?.aborted) return;
        setFundraisers(data);
      } catch (error) {
        if (!signal?.aborted) {
          console.error('[Dashboard] Failed to fetch fundraisers:', error);
          setHasError(true);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [accessToken]
  );

  useEffect(() => {
    // Mocks AbortSignal (AbortController) so stale responses are ignored if the effect re-runs before a fetch completes. This can happen if the user quickly navigates away and back to the dashboard, or if the access token changes.
    const signal = { aborted: false };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFundraisers(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchFundraisers]);

  const summary = useMemo(
    () =>
      fundraisers.length > 0 ? getDashboardSummary(fundraisers) : EMPTY_SUMMARY,
    [fundraisers]
  );

  const refetch = useCallback(() => {
    void fetchFundraisers();
  }, [fetchFundraisers]);

  return (
    <AuthGuard>
      <section className='space-y-6'>
        <BreadcrumbTrail
          items={[
            { label: t('breadcrumb.home'), href: '/' },
            { label: t('breadcrumb.dashboard') },
          ]}
        />

        <DashboardHeader />

        <DashboardSummary
          summary={summary}
          isLoading={isLoading}
          hasError={hasError}
          onRetry={refetch}
        />

        {!hasError && (
          <FundraiserList fundraisers={fundraisers} isLoading={isLoading} />
        )}
      </section>
    </AuthGuard>
  );
}
