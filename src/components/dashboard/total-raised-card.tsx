'use client';

import { useTranslations } from 'next-intl';
import { CardBase } from './card-base';

export function TotalRaisedCard() {
  const t = useTranslations('Dashboard');

  return (
    <CardBase
      title={t('cards.totalRaised.title')}
      description={t('cards.totalRaised.description')}
      value={t('cards.totalRaised.value')}
      helper={t('cards.totalRaised.empty')}
    />
  );
}
