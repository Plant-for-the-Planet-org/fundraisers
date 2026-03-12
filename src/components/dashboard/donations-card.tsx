'use client';

import { useTranslations } from 'next-intl';
import { CardBase } from './card-base';

export function DonationsCard() {
  const t = useTranslations('Dashboard');
  const count = 0;

  return (
    <CardBase
      title={t('cards.donations.title')}
      description={t('cards.donations.description')}
      value={count}
      helper={t('cards.donations.empty')}
    />
  );
}
