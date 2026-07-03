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
  FundraiserListSection,
} from '@/components/dashboard';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';

const EMPTY_SUMMARY: DashboardSummaryStats = {
  totalFundraiserCount: 0,
  activeFundraiserCount: 0,
  donationsCount: 0,
  consolidatedTotalRaised: null,
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const accessToken = useAuthStore(state => state.accessToken);

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Derived from the list so the stat tiles stay in sync with every mutation
  // (delete, activate, pause, resume) without a refetch. The list is the single
  // source of truth for both the rows and the summary.
  const summary = useMemo<DashboardSummaryStats>(
    () =>
      fundraisers.length > 0 ? getDashboardSummary(fundraisers) : EMPTY_SUMMARY,
    [fundraisers]
  );

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

    void fetchFundraisers(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchFundraisers]);

  const retryAfterError = useCallback(() => {
    void fetchFundraisers();
  }, [fetchFundraisers]);

  // Merge the updated fundraiser into local state. The affected row and the
  // summary tiles (derived from this list) both reflect the change; no refetch.
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

  // Delete: remove the fundraiser from the list. Both 204 (deleted) and
  // 200 (`status: 'archived'`) are treated as a successful delete.
  const handleFundraiserRemoved = useCallback((id: string) => {
    setFundraisers(prev => prev.filter(fundraiser => fundraiser.id !== id));
  }, []);

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
            onFundraiserRemoved={handleFundraiserRemoved}
          />
        )}
      </section>
    </AuthGuard>
  );
}
