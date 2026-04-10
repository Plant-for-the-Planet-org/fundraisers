'use client';

import { useTranslations } from 'next-intl';
import { getImageUrl } from '@/lib/utils/images';
import { getDisplayName } from '@/lib/utils/profile';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const ProfileCard = () => {
  const tDonate = useTranslations('Donate');
  const profile = useAuthStore(state => state.user?.profile);
  if (!profile) return null;

  const imageUrl = getImageUrl('profile', 'thumb', profile.image);
  const displayName = getDisplayName(profile);

  return (
    <div className='profile-card w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200'>
      <Avatar className='w-10 h-10'>
        {imageUrl && <AvatarImage src={imageUrl} loading='lazy' />}
        <AvatarFallback className='bg-linear-to-br from-green-500 to-blue-600' />
      </Avatar>

      <div className='flex-1 space-y-1'>
        <p className='text-foreground font-medium'>
          {displayName}
          {profile.type !== 'individual' && (
            <span className='ml-2 text-sm text-muted-foreground'>
              {tDonate('organization')}
            </span>
          )}
        </p>

        {profile.email && (
          <p className='text-sm text-muted-foreground'>{profile.email}</p>
        )}
      </div>
    </div>
  );
};
