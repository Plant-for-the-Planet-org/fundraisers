'use client';

import { useTranslations } from 'next-intl';
import { CardBase } from './card-base';

interface MyFundraisersCardProps {
  count: number;
}

export function MyFundraisersCard({ count }: MyFundraisersCardProps) {
  const t = useTranslations('Dashboard');

  return (
    <CardBase
      title={t('cards.myFundraisers.title')}
      description={t('cards.myFundraisers.description')}
      value={count.toLocaleString()}
      helper={count === 0 ? t('cards.myFundraisers.empty') : undefined}
    />
  );
}
