'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { convertTotalRaisedToSingleCurrency } from '@/lib/utils/fundraiser';
import { StatCell, StatStrip } from '../stat-strip';

interface FundraiserPerformanceProps {
  fundraiser: Fundraiser;
  donorCount: number | null;
}

export function FundraiserPerformance({
  fundraiser,
  donorCount,
}: FundraiserPerformanceProps) {
  const t = useTranslations('Dashboard.fundraiser.stats');
  const locale = useLocale();

  const raised = convertTotalRaisedToSingleCurrency(
    fundraiser.totalRaised,
    fundraiser.currency
  );
  const percent =
    fundraiser.goalAmount > 0
      ? Math.round((raised / fundraiser.goalAmount) * 100)
      : null;
  const average =
    fundraiser.donationCount > 0 ? raised / fundraiser.donationCount : 0;

  const money = (amount: number) =>
    formatCurrencyFromDecimal(amount, fundraiser.currency, locale, {
      compact: true,
    });

  return (
    <StatStrip columns={4}>
      <StatCell
        label={t('raised')}
        value={money(raised)}
        helper={
          percent === null
            ? t('noGoal')
            : t('raisedHelper', { percent, goal: money(fundraiser.goalAmount) })
        }
      />
      <StatCell
        label={t('donations')}
        value={formatCompactNumber(fundraiser.donationCount, locale)}
      />
      <StatCell
        label={t('donors')}
        value={
          donorCount === null ? '–' : formatCompactNumber(donorCount, locale)
        }
      />
      <StatCell label={t('average')} value={money(average)} />
    </StatStrip>
  );
}
