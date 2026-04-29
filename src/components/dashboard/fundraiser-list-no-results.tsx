'use client';

import { useTranslations } from 'next-intl';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FundraiserListNoResultsProps {
  onClearFilters: () => void;
}

export function FundraiserListNoResults({
  onClearFilters,
}: FundraiserListNoResultsProps) {
  const t = useTranslations('Dashboard.noResults');

  return (
    <div className='fundraiser-list-no-results flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center'>
      <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <SearchX className='h-6 w-6' aria-hidden='true' />
      </div>
      <h3 className='text-base font-semibold text-foreground'>{t('title')}</h3>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {t('description')}
      </p>
      <Button variant='outline' className='mt-4' onClick={onClearFilters}>
        {t('cta')}
      </Button>
    </div>
  );
}
