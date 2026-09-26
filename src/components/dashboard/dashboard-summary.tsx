'use client';

import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';
import type { WeeklyVisitors } from './use-weekly-visitors';

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
  /** Whether this deployment can count visitors. Decides the layout up front, so the strip does not change shape when the number arrives. */
  showVisitors: boolean;
  /** Null while loading or if the count failed; the cell shows a dash. */
  weeklyVisitors: WeeklyVisitors | null;
}

export function DashboardSummary({
  summary,
  isLoading,
  hasError,
  onRetry,
  showVisitors,
  weeklyVisitors,
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
      <StatStripSkeleton columns={showVisitors ? 4 : 3} label={t('loading')} />
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
    <StatStrip columns={showVisitors ? 4 : 3}>
      <StatCell label={t('totalRaised.label')} value={totalRaisedValue} />
      <StatCell
        label={t('donations.label')}
        value={formatCompactNumber(summary.donationsCount, locale)}
      />
      <StatCell
        label={t('fundraisers.label')}
        value={formatCompactNumber(summary.activeFundraiserCount, locale)}
      />
      {showVisitors && (
        <StatCell
          label={t('visitors.label')}
          value={
            weeklyVisitors
              ? formatCompactNumber(weeklyVisitors.visitors, locale)
              : '–'
          }
          delta={
            weeklyVisitors && (
              <StatDelta
                current={weeklyVisitors.visitors}
                previous={weeklyVisitors.previousVisitors}
                context={t('visitors.changeContext')}
              />
            )
          }
        />
      )}
    </StatStrip>
  );
}
