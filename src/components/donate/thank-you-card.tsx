'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';
import { StatusBadge } from './status-badge';

interface ThankYouCardProps {
  children?: ReactNode;
}

export function ThankYouCard({ children }: ThankYouCardProps) {
  const t = useTranslations('Donate.thankYou');

  return (
    <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
      {/* Header band */}
      <div className='bg-[#fdf8f0] px-6 pt-8 pb-6 text-center'>
        <h2 className='mb-2 text-xl font-bold text-gray-900'>
          {t('title.bankTransferPending')}
        </h2>

        <StatusBadge />

        <p className='mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500'>
          {t(`message.bankTransferPending`)}
        </p>
      </div>

      {/* Body — transfer details or other payment-specific content */}
      {children && <div className='px-6 py-5'>{children}</div>}
    </div>
  );
}
