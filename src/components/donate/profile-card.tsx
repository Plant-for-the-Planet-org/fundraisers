'use client';

import { getImageUrl } from '@/lib/utils/images';
import { getDisplayName } from '@/lib/utils/profile';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useTranslations } from 'next-intl';

const PROFILE_TYPE = {
  INDIVIDUAL: 'individual',
};

export const ProfileCard = () => {
  const tDonate = useTranslations('Donate');
  //  store: state
  const profile = useAuthStore(state => state.user?.profile);
  if (!profile) return null;

  const imageUrl = getImageUrl('profile', 'thumb', profile.image);
  const displayName = getDisplayName(profile);

  return (
    <div className='w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200'>
      <Avatar className='w-10 h-10'>
        {imageUrl && (
          <AvatarImage src={imageUrl} alt='Profile' loading='lazy' />
        )}
        <AvatarFallback className='bg-gradient-to-br from-green-500 to-blue-600' />
      </Avatar>

      <div className='flex-1 space-y-1'>
        <p className='text-gray-900 font-medium'>
          {displayName}
          {profile.type !== PROFILE_TYPE.INDIVIDUAL && (
            <span className='ml-2 text-sm text-gray-500'>
              {tDonate('organization')}
            </span>
          )}
        </p>

        {profile.email && (
          <p className='text-gray-600 text-sm'>{profile.email}</p>
        )}
      </div>
    </div>
  );
};
