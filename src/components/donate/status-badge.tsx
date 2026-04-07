'use client';

import { useTranslations } from 'next-intl';

export function StatusBadge() {
  const t = useTranslations('Donate.thankYou.status');

  return (
    <div className='inline-flex items-center gap-1.5 text-xs'>
      <span className='font-medium text-gray-500'>{t('label')}</span>
      <span className='inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20'>
        {t('bankTransferPending')}
      </span>
    </div>
  );
}
