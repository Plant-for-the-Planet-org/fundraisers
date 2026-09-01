'use client';

import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';

import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
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

  const { consolidatedTotalRaised } = summary;

  // Until a fundraiser has a currency set there is nothing to format against, so fall back to a plain zero.
  const totalRaisedValue = consolidatedTotalRaised
    ? formatCurrencyFromDecimal(
        consolidatedTotalRaised.amount,
        consolidatedTotalRaised.currency,
        locale,
        { compact: true }
      )
    : formatCompactNumber(0, locale);

  const fundraisersHelper = t.rich('fundraisers.activeStatus', {
    count: summary.activeFundraiserCount,
    bold: chunks => (
      <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
        {chunks}
      </span>
    ),
  });

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <SummaryStatCard
        label={t('fundraisers.label')}
        value={formatCompactNumber(summary.totalFundraiserCount, locale)}
        helper={fundraisersHelper}
      />
      <SummaryStatCard
        label={t('totalRaised.label')}
        value={totalRaisedValue}
        helper={t('totalRaised.helper')}
      />
      <SummaryStatCard
        label={t('donations.label')}
        value={formatCompactNumber(summary.donationsCount, locale)}
        helper={t('donations.helper')}
      />
    </div>
  );
}
