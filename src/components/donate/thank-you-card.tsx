'use client';

import type { ReactNode } from 'react';
import type { DonationFrequency } from '@/lib/types/donation';

import { useTranslations } from 'next-intl';
import { CircleCheckBig } from 'lucide-react';
import { StatusBadge } from './status-badge';

type ThankYouVariant = 'completed' | 'bankTransferPending';

// It may be worth discriminating the props by variant if we add more variants in the future with more divergent content requirements
interface ThankYouCardProps {
  variant: ThankYouVariant;
  frequency?: DonationFrequency;
  formattedAmount?: string;
  children?: ReactNode;
}

export function ThankYouCard({
  variant,
  frequency,
  formattedAmount,
  children,
}: ThankYouCardProps) {
  const t = useTranslations('Donate.thankYou');

  const message =
    variant === 'bankTransferPending'
      ? t(`message.bankTransferPending.${frequency ?? 'once'}`, {
          amount: formattedAmount ?? '',
        })
      : t('message.completed');

  return (
    <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
      {/* Header band */}
      <div className='bg-[#fdf8f0] px-6 pt-8 pb-6 text-center'>
        {variant === 'completed' && (
          <CircleCheckBig
            className='mx-auto mb-4 size-14 text-green-700'
            strokeWidth={1.5}
          />
        )}

        <h2 className='mb-2 text-xl font-bold text-gray-900'>
          {t(`title.${variant}`)}
        </h2>

        <StatusBadge variant={variant} />

        <p className='mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500'>
          {message}
        </p>
      </div>

      {/* Body — transfer details or other payment-specific content */}
      {children && <div className='px-6 py-5'>{children}</div>}
    </div>
  );
}
