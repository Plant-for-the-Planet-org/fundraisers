'use client';

import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useCallback, useEffect, useState } from 'react';
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
  FundraiserListSection,
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
  const [summary, setSummary] = useState<DashboardSummaryStats>(EMPTY_SUMMARY);
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
        setSummary(data.length > 0 ? getDashboardSummary(data) : EMPTY_SUMMARY);
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

    void fetchFundraisers(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchFundraisers]);

  const retryAfterError = useCallback(() => {
    void fetchFundraisers();
  }, [fetchFundraisers]);

  // Merge locally so only the affected row re-renders; summary stays at its
  // last full-load snapshot (deliberately not derived from this list).
  const handleFundraiserUpdated = useCallback(
    (updatedFundraiser: Fundraiser) => {
      setFundraisers(prev =>
        prev.map(fundraiser =>
          fundraiser.id === updatedFundraiser.id
            ? { ...fundraiser, ...updatedFundraiser }
            : fundraiser
        )
      );
    },
    []
  );

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
          onRetry={retryAfterError}
        />

        {!hasError && (
          <FundraiserListSection
            fundraisers={fundraisers}
            isLoading={isLoading}
            onFundraiserUpdated={handleFundraiserUpdated}
          />
        )}
      </section>
    </AuthGuard>
  );
}
