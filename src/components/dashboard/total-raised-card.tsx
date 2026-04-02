'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { DashboardRaisedSummary } from '@/lib/api/fundraisers-service';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

import { CardBase } from './card-base';

interface TotalRaisedCardProps {
  summaries: DashboardRaisedSummary[];
}

export function TotalRaisedCard({ summaries }: TotalRaisedCardProps) {
  const tTotalRaised = useTranslations('Dashboard.cards.totalRaised');
  const locale = useLocale();

  const displaySummaries =
    summaries.length > 0
      ? summaries
      : [
          { currency: 'EUR', totalRaised: 0, fundraiserCount: 0 },
          { currency: 'USD', totalRaised: 0, fundraiserCount: 0 },
        ];

  const value = (
    <span className='block'>
      {displaySummaries.map(summary => {
        const formattedAmount = formatCurrencyFromDecimal(
          summary.totalRaised,
          summary.currency,
          locale
        );

        return (
          <span key={summary.currency} className='block'>
            {tTotalRaised('summaryLine', {
              amount: formattedAmount,
              count: summary.fundraiserCount,
            })}
          </span>
        );
      })}
    </span>
  );

  return (
    <CardBase
      title={tTotalRaised('title')}
      description={tTotalRaised('description')}
      value={value}
      helper={tTotalRaised('aggregatedByCurrency')}
    />
  );
}
