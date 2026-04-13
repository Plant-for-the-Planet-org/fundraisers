'use client';

import { useTranslations } from 'next-intl';
import { CardBase } from './card-base';

interface DonationsCardProps {
  value: number;
  hasDonationData: boolean;
}

export function DonationsCard({ value, hasDonationData }: DonationsCardProps) {
  const t = useTranslations('Dashboard');

  return (
    <CardBase
      title={t('cards.donations.title')}
      description={t('cards.donations.description')}
      value={value.toLocaleString()}
      helper={!hasDonationData ? t('cards.donations.empty') : undefined}
    />
  );
}
