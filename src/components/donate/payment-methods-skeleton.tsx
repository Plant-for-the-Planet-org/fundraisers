'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export function PaymentMethodsSkeleton() {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <h2 className='text-foreground font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>
      <div className='border border-border rounded-lg'>
        <div className='space-y-3 p-4'>
          {[0, 1, 2].map(i => (
            <div key={i} className='rounded-lg border border-border p-3'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4 shrink-0 rounded-full' />
                <Skeleton className='h-5 w-12 shrink-0' />
                <Skeleton className='h-4 w-28' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
