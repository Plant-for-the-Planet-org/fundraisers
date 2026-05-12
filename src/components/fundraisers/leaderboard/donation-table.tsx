import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor } from './avatar-utils';

interface DonationTableProps {
  donations: LeaderboardDonation[];
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
  showDate?: boolean;
}

function DonationRow({
  donation,
  anonymize,
  showAmount,
  showAvatar,
  showDate = true,
}: {
  donation: LeaderboardDonation;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
  showDate?: boolean;
}) {
  const t = useTranslations('Leaderboard.view');
  const isAnonymous = anonymize || donation.isAnonymous || false;
  const displayName = isAnonymous
    ? t('donation.anonymous')
    : donation.donorName;

  return (
    <tr>
      <td className='py-3 px-4'>
        <div className='flex items-center gap-3 min-w-0'>
          {showAvatar && (
            <Avatar className='h-8 w-8 shrink-0 ring-2 ring-white/20 dark:ring-gray-500/20'>
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
          <div className='flex flex-col min-w-0'>
            <span
              className={cn(
                'truncate text-sm font-semibold leading-tight',
                isAnonymous
                  ? 'text-zinc-500 dark:text-gray-400 italic'
                  : 'text-zinc-800 dark:text-gray-100'
              )}
            >
              {displayName}
            </span>
            {showDate && (
              <span className='text-xs text-muted-foreground leading-tight mt-0.5'>
                {formatTimeAgo(donation.created)}
              </span>
            )}
          </div>
        </div>
      </td>
      {showAmount && (
        <td className='py-3 px-4 text-right text-sm font-semibold text-foreground whitespace-nowrap'>
          {formatCurrencyFromDecimal(donation.amount, donation.currency)}
        </td>
      )}
    </tr>
  );
}

export function DonationTable({
  donations,
  anonymize,
  showAmount,
  showAvatar,
  showDate = true,
}: DonationTableProps) {
  const t = useTranslations('Leaderboard.view');

  return (
    <table className='w-full'>
      <thead className='sticky top-0 z-10 bg-background'>
        <tr className='border-b border-border'>
          <th className='w-full py-2 px-4 text-left text-xs font-medium text-muted-foreground'>
            {t('viewAllOverlay.columnDonor')}
          </th>
          {showAmount && (
            <th className='py-2 px-4 text-right text-xs font-medium text-muted-foreground whitespace-nowrap'>
              {t('viewAllOverlay.columnAmount')}
            </th>
          )}
        </tr>
      </thead>
      <tbody className='divide-y divide-border'>
        {donations.map(donation => (
          <DonationRow
            key={donation.id}
            donation={donation}
            anonymize={anonymize}
            showAmount={showAmount}
            showAvatar={showAvatar}
            showDate={showDate}
          />
        ))}
      </tbody>
    </table>
  );
}
