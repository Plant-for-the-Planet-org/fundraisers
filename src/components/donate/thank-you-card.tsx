'use client';

import type { ReactNode } from 'react';
import type {
  DonationFrequency,
  DonationPaymentStatus,
} from '@/lib/types/donation';
import type { PaymentResultGroup } from './status-badge';

import { useTranslations } from 'next-intl';
import { CircleCheckBig } from 'lucide-react';
import { StatusBadge } from './status-badge';

type ThankYouVariant =
  | 'completed'
  | 'bankTransferPending'
  | 'paymentProcessing';

function getPaymentResultGroup(
  paymentResult: DonationPaymentStatus
): PaymentResultGroup {
  if (paymentResult === 'pending' || paymentResult === 'initiated')
    return 'processing';
  if (paymentResult === 'failed' || paymentResult === 'canceled')
    return 'failed';
  if (paymentResult === 'refunded') return 'refunded';
  if (paymentResult === 'in-dispute' || paymentResult === 'dispute-lost')
    return 'disputed';
  return 'error';
}

interface ThankYouCardProps {
  variant: ThankYouVariant;
  frequency?: DonationFrequency;
  formattedAmount?: string;
  children?: ReactNode;
  paymentResult?: DonationPaymentStatus;
}

export function ThankYouCard({
  variant,
  frequency,
  formattedAmount,
  children,
  paymentResult,
}: ThankYouCardProps) {
  const t = useTranslations('Donate.thankYou');

  let paymentResultGroup: PaymentResultGroup | undefined;
  let title: string;
  let message: string;

  if (variant === 'paymentProcessing') {
    paymentResultGroup = paymentResult
      ? getPaymentResultGroup(paymentResult)
      : 'processing';
    title = t(`title.paymentProcessing.${paymentResultGroup}`);
    message = t(`message.paymentProcessing.${paymentResultGroup}`);
  } else if (variant === 'bankTransferPending') {
    title = t('title.bankTransferPending');
    message = t(`message.bankTransferPending.${frequency ?? 'once'}`, {
      amount: formattedAmount ?? '',
    });
  } else {
    title = t('title.completed');
    message = t('message.completed');
  }

  return (
    <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
      {/* Header band */}
      <div className='bg-white px-6 pt-8 pb-6 text-center'>
        {variant === 'completed' && (
          <CircleCheckBig
            className='mx-auto mb-4 size-14 text-green-700'
            strokeWidth={1.5}
          />
        )}

        <h2 className='mb-2 text-xl font-bold text-gray-900'>{title}</h2>

        <StatusBadge
          variant={variant}
          paymentResultGroup={paymentResultGroup}
        />

        <p className='mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500'>
          {message}
        </p>
      </div>

      {/* Body — transfer details or other payment-specific content */}
      {children !== undefined && <div className='px-6 py-5'>{children}</div>}
    </div>
  );
}
