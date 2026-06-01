'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils/images';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_AVATARS = 5;
const MAX_NAMED = 2;

interface DonorsStripProps {
  donations: LeaderboardDonation[];
  donationCount: number;
}

export function DonorsStrip({ donations, donationCount }: DonorsStripProps) {
  const t = useTranslations('Fundraisers');

  if (donations.length === 0) return null;

  // Dedupe named donors by name; keep each anonymous donation as a distinct
  // entry since each likely represents a different person.
  const seen = new Set<string>();
  const unique = donations.filter(d => {
    const key = d.isAnonymous ? `anon:${d.id}` : `named:${d.donorName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const avatarDonors = unique.slice(0, MAX_AVATARS);
  // Prefer non-anonymous donors for the names line; hide the line entirely
  // if everyone is anonymous.
  const namedDonors = unique.filter(d => !d.isAnonymous).slice(0, MAX_NAMED);
  // Counting donations, not donors. A repeat giver inflates the "others" number
  // (e.g. Maria gave 3 times alone → "Maria and 2 others"); accepted trade-off.
  const remainingCount = Math.max(0, donationCount - namedDonors.length);
  const namesText = namedDonors
    .map(d => d.donorName.split(' ')[0] ?? d.donorName)
    .join(', ');

  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex items-center'>
        {avatarDonors.map((donor, index) => {
          const avatarSrc = donor.avatarUrl
            ? getImageUrl('profile', 'thumb', donor.avatarUrl)
            : null;
          return (
            <Avatar
              key={donor.id}
              className={cn(
                'w-6 h-6 border-2 border-card',
                index > 0 && '-ml-2'
              )}
              title={donor.donorName}
            >
              {avatarSrc && (
                <AvatarImage src={avatarSrc} alt='' loading='lazy' />
              )}
              <FallbackAvatar seed={donor.id} />
            </Avatar>
          );
        })}
      </div>

      {namedDonors.length > 0 && (
        <div className='text-zinc-800 dark:text-gray-100 text-sm font-normal leading-tight'>
          {remainingCount > 0
            ? t('donorsAndOthers', {
                names: namesText,
                count: remainingCount,
              })
            : namesText}
        </div>
      )}
    </div>
  );
}

export function DonorsStripSkeleton() {
  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex items-center'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('w-6 h-6 rounded-full', i > 0 && '-ml-2')}
          />
        ))}
      </div>
      <Skeleton className='h-4 w-40' />
    </div>
  );
}
