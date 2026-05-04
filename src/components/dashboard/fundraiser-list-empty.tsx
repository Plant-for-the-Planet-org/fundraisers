'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FundraiserListEmpty() {
  const t = useTranslations('Dashboard.list.empty');

  return (
    <div className='fundraiser-list-empty flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center'>
      <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <HeartHandshake className='h-6 w-6' aria-hidden='true' />
      </div>
      <h3 className='text-base font-semibold text-foreground'>{t('title')}</h3>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {t('description')}
      </p>
      <Button asChild className='mt-4'>
        <Link href='/fundraisers/create'>{t('cta')}</Link>
      </Button>
    </div>
  );
}
