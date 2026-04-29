'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface DashboardStatsErrorProps {
  onRetry: () => void;
}

export function DashboardStatsError({ onRetry }: DashboardStatsErrorProps) {
  const t = useTranslations('Dashboard.statsError');

  return (
    <div
      className='dashboard-stats-error md:col-span-3 bg-transparent px-6 py-10 text-center'
      role='alert'
    >
      <h2 className='text-lg font-semibold text-foreground mb-2'>
        {t('title')}
      </h2>
      <p className='text-muted-foreground text-sm mb-6 max-w-md mx-auto'>
        {t('description')}
      </p>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        <Button type='button' variant='default' onClick={onRetry}>
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
