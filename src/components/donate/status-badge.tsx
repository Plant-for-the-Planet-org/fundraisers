'use client';

import { useTranslations } from 'next-intl';

type BadgeVariant = 'completed' | 'bankTransferPending';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  bankTransferPending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
}

export function StatusBadge({ variant }: StatusBadgeProps) {
  const t = useTranslations('Donate.thankYou.status');

  return (
    <div className='inline-flex items-center gap-1.5 text-xs'>
      <span className='font-medium text-gray-500'>{t('label')}</span>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ring-1 ring-inset ${BADGE_STYLES[variant]}`}
      >
        {t(variant)}
      </span>
    </div>
  );
}
