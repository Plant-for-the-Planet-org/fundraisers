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
  totalCount: 0,
  activeCount: 0,
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
    async (abort?: { cancelled: boolean }) => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const data = await getFundraisers(accessToken);
        if (abort?.cancelled) return;
        setFundraisers(data);
      } catch (error) {
        if (!abort?.cancelled) {
          console.error('[Dashboard] Failed to fetch fundraisers:', error);
          setHasError(true);
        }
      } finally {
        if (!abort?.cancelled) {
          setIsLoading(false);
        }
      }
    },
    [accessToken]
  );

  useEffect(() => {
    const abort = { cancelled: false };
    void fetchFundraisers(abort);
    return () => {
      abort.cancelled = true;
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
