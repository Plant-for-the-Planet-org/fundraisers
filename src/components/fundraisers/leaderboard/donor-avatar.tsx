import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils/images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor } from './avatar-utils';

export function isAnonymousDonor(
  donation: LeaderboardDonation,
  anonymize: boolean
): boolean {
  return anonymize || donation.isAnonymous || false;
}

interface DonorAvatarProps {
  donation: LeaderboardDonation;
  anonymize: boolean;
  className?: string;
}

export function DonorAvatar({
  donation,
  anonymize,
  className,
}: DonorAvatarProps) {
  const isAnonymous = isAnonymousDonor(donation, anonymize);
  const avatarSrc =
    !isAnonymous && donation.avatarUrl
      ? getImageUrl('profile', 'thumb', donation.avatarUrl)
      : null;

  return (
    <Avatar
      className={cn(
        'h-8 w-8 shrink-0 ring-2 ring-white/20 dark:ring-gray-500/20',
        className
      )}
    >
      {avatarSrc !== null && (
        <AvatarImage src={avatarSrc} alt={donation.donorName} loading='lazy' />
      )}
      <AvatarFallback className={getAvatarColor(donation.id)} />
    </Avatar>
  );
}
