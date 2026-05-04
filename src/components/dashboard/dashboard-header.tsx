'use client';

import { useTranslations } from 'next-intl';

export function DashboardHeader() {
  const t = useTranslations('Dashboard.manageFundraisers');

  return (
    <div>
      <h1 className='text-3xl font-bold text-foreground'>{t('title')}</h1>
      <p className='mt-1 text-muted-foreground'>{t('subtitle')}</p>
    </div>
  );
}
