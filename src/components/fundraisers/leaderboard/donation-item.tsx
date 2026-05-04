import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DonationItemProps {
  donation: LeaderboardDonation;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
}

const FALLBACK_COLORS = [
  'bg-amber-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-lime-500',
  'bg-cyan-500',
  'bg-rose-500',
];

function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? 'bg-gray-500';
}

export function DonationItem({
  donation,
  anonymize,
  showAmount,
  showAvatar,
}: DonationItemProps) {
  const t = useTranslations('Leaderboard.view');
  const isAnonymous = anonymize || donation.isAnonymous || false;
  const displayName = isAnonymous
    ? t('anonymous')
    : donation.donorName.length > 17
      ? `${donation.donorName.substring(0, 17)}...`
      : donation.donorName;

  return (
    <div className='donation-item flex items-center gap-3 shrink-0'>
      {showAvatar && (
        <Avatar className='h-8 w-8 ring-2 ring-white/20 dark:ring-gray-500/20'>
          {!isAnonymous && donation.avatarUrl && (
            <AvatarImage
              src={donation.avatarUrl}
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
          {showAmount
            ? `${formatCurrencyFromDecimal(donation.amount, donation.currency)} • `
            : ''}
          {formatTimeAgo(donation.created)}
        </div>
      </div>
    </div>
  );
}
