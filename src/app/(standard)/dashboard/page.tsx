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
  totalRaisedByCurrency: [],
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const accessToken = useAuthStore(state => state.accessToken);

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchFundraisers = useCallback(
    async (isIgnored?: () => boolean) => {
      if (!accessToken) return;

      try {
        const data = await getFundraisers(accessToken);
        if (isIgnored?.()) return;
        setFundraisers(data);
        setHasError(false);
      } catch (error) {
        if (isIgnored?.()) return;
        console.error('[Dashboard] Failed to fetch fundraisers:', error);
        setHasError(true);
      } finally {
        if (!isIgnored?.()) setIsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    let shouldIgnore = false;
    void fetchFundraisers(() => shouldIgnore);
    return () => {
      shouldIgnore = true;
    };
  }, [fetchFundraisers]);

  const summary = useMemo(
    () =>
      fundraisers.length > 0 ? getDashboardSummary(fundraisers) : EMPTY_SUMMARY,
    [fundraisers]
  );

  const refetch = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
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
          <FundraiserListSection
            fundraisers={fundraisers}
            isLoading={isLoading}
            onMutate={refetch}
          />
        )}
      </section>
    </AuthGuard>
  );
}
