'use client';

import { useTranslations } from 'next-intl';
import { CardBase } from './card-base';

interface MyFundraisersCardProps {
  count: number;
}

export function MyFundraisersCard({ count }: MyFundraisersCardProps) {
  const tMyFundraisers = useTranslations('Dashboard.cards.myFundraisers');

  return (
    <CardBase
      title={tMyFundraisers('title')}
      description={tMyFundraisers('description')}
      value={count.toLocaleString()}
      helper={
        count === 0
          ? tMyFundraisers('empty')
          : tMyFundraisers('activeFundraisers')
      }
    />
  );
}
