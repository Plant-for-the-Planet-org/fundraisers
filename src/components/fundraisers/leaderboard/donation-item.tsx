import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';
import { DonorAvatar, isAnonymousDonor } from './donor-avatar';

interface DonationItemProps {
  donation: LeaderboardDonation;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
  showDate?: boolean;
}

export function DonationItem({
  donation,
  anonymize,
  showAmount,
  showAvatar,
  showDate = true,
}: DonationItemProps) {
  const t = useTranslations('Leaderboard.view');
  const isAnonymous = isAnonymousDonor(donation, anonymize);
  const displayName = isAnonymous
    ? t('donation.anonymous')
    : donation.donorName.length > 17
      ? `${donation.donorName.substring(0, 17)}...`
      : donation.donorName;

  return (
    <div className='donation-item flex items-center gap-3 shrink-0'>
      {showAvatar && <DonorAvatar donation={donation} anonymize={anonymize} />}
      <div className='flex flex-col justify-center items-start gap-0.5 min-w-0'>
        <div
          className={cn(
            'text-sm font-semibold leading-tight whitespace-nowrap',
            isAnonymous
              ? 'text-zinc-500 dark:text-gray-400 italic'
              : 'text-zinc-800 dark:text-gray-100'
          )}
        >
          {displayName}
        </div>
        <div className='text-zinc-600 dark:text-gray-300 text-xs font-medium leading-tight whitespace-nowrap'>
          {showAmount &&
            formatCurrencyFromDecimal(donation.amount, donation.currency)}
          {showAmount && showDate && ' • '}
          {showDate && formatTimeAgo(donation.created)}
        </div>
      </div>
    </div>
  );
}
