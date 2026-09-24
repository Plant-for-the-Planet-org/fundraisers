'use client';

import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';
import type { WeeklyViews } from './use-weekly-views';

import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { DashboardStatsError } from './dashboard-stats-error';
import {
  StatCell,
  StatDelta,
  StatStrip,
  StatStripSkeleton,
} from './stat-strip';

interface DashboardSummaryProps {
  summary: DashboardSummaryStats;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  /** Whether this deployment can count views. Decides the layout up front, so the strip does not change shape when the number arrives. */
  showViews: boolean;
  /** Null while loading or if the count failed; the cell shows a dash. */
  weeklyViews: WeeklyViews | null;
}

export function DashboardSummary({
  summary,
  isLoading,
  hasError,
  onRetry,
  showViews,
  weeklyViews,
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
      <StatStripSkeleton columns={showViews ? 4 : 3} label={t('loading')} />
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

  return (
    <StatStrip columns={showViews ? 4 : 3}>
      <StatCell label={t('totalRaised.label')} value={totalRaisedValue} />
      <StatCell
        label={t('donations.label')}
        value={formatCompactNumber(summary.donationsCount, locale)}
      />
      <StatCell
        label={t('fundraisers.label')}
        value={formatCompactNumber(summary.activeFundraiserCount, locale)}
      />
      {showViews && (
        <StatCell
          label={t('views.label')}
          value={
            weeklyViews ? formatCompactNumber(weeklyViews.views, locale) : '–'
          }
          delta={
            weeklyViews && (
              <StatDelta
                current={weeklyViews.views}
                previous={weeklyViews.previousViews}
                context={t('views.changeContext')}
              />
            )
          }
        />
      )}
    </StatStrip>
  );
}
