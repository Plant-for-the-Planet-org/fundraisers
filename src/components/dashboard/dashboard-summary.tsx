'use client';

import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { DashboardStatsError } from './dashboard-stats-error';
import { SummaryStatCard } from './summary-stat-card';
import { SummaryStatCardSkeleton } from './summary-stat-card-skeleton';

interface DashboardSummaryProps {
  summary: DashboardSummaryStats;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

export function DashboardSummary({
  summary,
  isLoading,
  hasError,
  onRetry,
}: DashboardSummaryProps) {
  const t = useTranslations('Dashboard.summary');
  const locale = useLocale();

  if (hasError) {
    return (
      <div className='grid gap-4 md:grid-cols-3'>
        <DashboardStatsError onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-3'>
        <SummaryStatCardSkeleton />
        <SummaryStatCardSkeleton />
        <SummaryStatCardSkeleton />
      </div>
    );
  }

  const totalRaised = summary.totalRaisedByCurrency;
  const dominant = totalRaised[0];
  const extraCurrencies = totalRaised.length - 1;

  const totalRaisedValue = dominant
    ? formatCurrencyFromDecimal(dominant.totalRaised, dominant.currency, locale)
    : t('totalRaised.empty');

  const totalRaisedHelper =
    extraCurrencies > 0
      ? t('totalRaised.moreCurrencies', { count: extraCurrencies })
      : t('totalRaised.helper');

  const fundraisersHelper =
    summary.activeFundraiserCount > 0 ? (
      <>
        <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
          {summary.activeFundraiserCount.toLocaleString(locale)}
        </span>{' '}
        {t('fundraisers.activeSuffix')}
      </>
    ) : (
      t('fundraisers.noActive')
    );

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <SummaryStatCard
        label={t('fundraisers.label')}
        value={summary.totalFundraiserCount.toLocaleString(locale)}
        helper={fundraisersHelper}
      />
      <SummaryStatCard
        label={t('totalRaised.label')}
        value={totalRaisedValue}
        helper={totalRaisedHelper}
      />
      <SummaryStatCard
        label={t('donations.label')}
        value={summary.donationsCount.toLocaleString(locale)}
        helper={t('donations.helper')}
      />
    </div>
  );
}
