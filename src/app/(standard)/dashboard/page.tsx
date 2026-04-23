'use client';

import type { DashboardFundraiserStats } from '@/lib/api/fundraisers-service';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getDashboardFundraiserStats,
  getFundraisers,
} from '@/lib/api/fundraisers-service';
import { useAuthStore } from '@/stores/auth-store';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  DashboardStatCardSkeleton,
  DashboardStatsError,
  MyFundraisersCard,
  TotalRaisedCard,
} from '@/components/dashboard';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';

const INITIAL_FUNDRAISER_STATS: DashboardFundraiserStats = {
  activeFundraisersCount: 0,
  totalRaisedByCurrency: [],
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const [fundraiserStats, setFundraiserStats] =
    useState<DashboardFundraiserStats>(INITIAL_FUNDRAISER_STATS);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const profile = user?.profile;

  const displayName =
    profile?.displayName || user?.name || user?.email || t('fallbackName');

  const fetchDashboardStats = useCallback(
    async (abort?: { cancelled: boolean }) => {
      if (!accessToken) {
        setIsStatsLoading(false);
        return;
      }

      setIsStatsLoading(true);
      setStatsError(false);

      try {
        const fundraisers = await getFundraisers(accessToken);
        if (abort?.cancelled) {
          return;
        }
        setFundraiserStats(getDashboardFundraiserStats(fundraisers));
      } catch (error) {
        if (!abort?.cancelled) {
          console.error('[Dashboard] Failed to fetch fundraiser stats:', error);
          setStatsError(true);
        }
      } finally {
        if (!abort?.cancelled) {
          setIsStatsLoading(false);
        }
      }
    },
    [accessToken]
  );

  useEffect(() => {
    const abort = { cancelled: false };
    void fetchDashboardStats(abort);
    return () => {
      abort.cancelled = true;
    };
  }, [fetchDashboardStats]);

  return (
    <AuthGuard>
      <section className='space-y-6'>
        <BreadcrumbTrail
          items={[
            { label: t('breadcrumb.home'), href: '/' },
            { label: t('dashboard') },
          ]}
        />

        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            {t('dashboard')}
          </h1>
          <p className='text-muted-foreground'>
            {t('welcome', { displayName })}
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {statsError ? (
            <DashboardStatsError onRetry={() => void fetchDashboardStats()} />
          ) : isStatsLoading ? (
            <>
              <DashboardStatCardSkeleton />
              <DashboardStatCardSkeleton />
            </>
          ) : (
            <>
              <MyFundraisersCard
                count={fundraiserStats.activeFundraisersCount}
              />
              <TotalRaisedCard
                summaries={fundraiserStats.totalRaisedByCurrency}
              />
            </>
          )}
        </div>
      </section>
    </AuthGuard>
  );
}
