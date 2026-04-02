'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MyFundraisersCard } from '@/components/dashboard';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';
import {
  getDashboardFundraiserStats,
  getFundraisers,
} from '@/lib/api/fundraisers-service';
import type { DashboardFundraiserStats } from '@/lib/api/fundraisers-service';
import { useAuthStore } from '@/stores/authStore';

const INITIAL_FUNDRAISER_STATS: DashboardFundraiserStats = {
  activeFundraisersCount: 0,
  totalRaised: 0,
  totalRaisedCurrency: 'EUR',
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const [fundraiserStats, setFundraiserStats] =
    useState<DashboardFundraiserStats>(INITIAL_FUNDRAISER_STATS);

  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const profile = user?.profile;

  const displayName =
    profile?.displayName || user?.name || user?.email || t('fallbackName');

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const fundraisers = await getFundraisers(accessToken);

        if (!isActive) {
          return;
        }

        const stats = getDashboardFundraiserStats(fundraisers);
        setFundraiserStats(stats);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('[Dashboard] Failed to fetch fundraiser stats:', error);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [accessToken]);

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
          <MyFundraisersCard count={fundraiserStats.activeFundraisersCount} />
        </div>
      </section>
    </AuthGuard>
  );
}
