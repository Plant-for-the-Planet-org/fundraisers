import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getImageUrl } from '@/lib/utils/images';
import { formatTimeAgo } from '@/lib/utils/time';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor } from './avatar-utils';

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
  const isAnonymous = anonymize || donation.isAnonymous || false;
  const avatarSrc =
    !isAnonymous && donation.avatarUrl
      ? getImageUrl('profile', 'thumb', donation.avatarUrl)
      : null;
  const displayName = isAnonymous
    ? 'Anonymous'
    : donation.donorName.length > 17
      ? `${donation.donorName.substring(0, 17)}...`
      : donation.donorName;

  return (
    <div className='donation-item flex items-center gap-3 shrink-0'>
      {showAvatar && (
        <Avatar className='h-8 w-8 ring-2 ring-white/20 dark:ring-gray-500/20'>
          {avatarSrc !== null && (
            <AvatarImage
              src={avatarSrc}
              alt={donation.donorName}
              loading='lazy'
            />
          )}
          <AvatarFallback className={getAvatarColor(donation.id)} />
        </Avatar>
      )}
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
