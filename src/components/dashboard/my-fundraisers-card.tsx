'use client';

import { useTranslations } from 'next-intl';
import { CardBase } from './card-base';

export function MyFundraisersCard() {
  const t = useTranslations('Dashboard');
  const count = 0;

  return (
    <CardBase
      title={t('cards.myFundraisers.title')}
      description={t('cards.myFundraisers.description')}
      value={count}
      helper={t('cards.myFundraisers.empty')}
    />
  );
}
