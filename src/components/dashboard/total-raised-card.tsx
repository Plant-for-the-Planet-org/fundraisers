'use client';

import { useTranslations } from 'next-intl';

import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

import { CardBase } from './card-base';

interface TotalRaisedCardProps {
  amount: number;
  currency: string;
}

export function TotalRaisedCard({ amount, currency }: TotalRaisedCardProps) {
  const t = useTranslations('Dashboard');

  return (
    <CardBase
      title={t('cards.totalRaised.title')}
      description={t('cards.totalRaised.description')}
      value={formatCurrencyFromDecimal(amount, currency)}
      helper={amount <= 0 ? t('cards.totalRaised.empty') : undefined}
    />
  );
}
