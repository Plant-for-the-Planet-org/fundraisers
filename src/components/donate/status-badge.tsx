'use client';

import { useTranslations } from 'next-intl';

export type PaymentResultGroup =
  | 'processing'
  | 'failed'
  | 'refunded'
  | 'disputed'
  | 'error';

type BadgeVariant = 'completed' | 'bankTransferPending' | 'paymentProcessing';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  completed: 'bg-success/10 text-success ring-success/20',
  bankTransferPending: 'bg-warning/10 text-warning ring-warning/20',
  paymentProcessing: 'bg-warning/10 text-warning ring-warning/20',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  paymentResultGroup?: PaymentResultGroup;
}

export function StatusBadge({ variant, paymentResultGroup }: StatusBadgeProps) {
  const t = useTranslations('Donate.thankYou.status');

  const badgeText =
    variant === 'paymentProcessing'
      ? t(`paymentProcessing.${paymentResultGroup ?? 'processing'}`)
      : t(variant);

  return (
    <div className='inline-flex items-center gap-1.5 text-xs'>
      <span className='font-medium text-muted-foreground'>{t('label')}</span>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ring-1 ring-inset ${BADGE_STYLES[variant]}`}
      >
        {badgeText}
      </span>
    </div>
  );
}
