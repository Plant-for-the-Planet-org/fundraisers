'use client';

import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  DashboardHeader,
  DashboardStatsError,
  FundraiserListSection,
  useDashboardFundraisers,
} from '@/components/dashboard';

export default function DashboardFundraisersPage() {
  const t = useTranslations('Dashboard.manageFundraisers');
  const {
    fundraisers,
    isLoading,
    hasError,
    refetch,
    onFundraiserUpdated,
    onFundraiserRemoved,
  } = useDashboardFundraisers();

  return (
    <AuthGuard>
      <section className='space-y-6'>
        <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

        {hasError ? (
          <DashboardStatsError onRetry={refetch} />
        ) : (
          <FundraiserListSection
            fundraisers={fundraisers}
            isLoading={isLoading}
            onFundraiserUpdated={onFundraiserUpdated}
            onFundraiserRemoved={onFundraiserRemoved}
          />
        )}
      </section>
    </AuthGuard>
  );
}
