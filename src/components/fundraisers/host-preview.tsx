'use client';

import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/utils/images';
import { SectionHeader } from './typography';
import { useAuthStore } from '@/stores/authStore';

export function HostPreview() {
  const t = useTranslations('Fundraisers');

  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  if (isAuthInitializing) {
    return <div className='h-16 bg-gray-200 rounded-xl animate-pulse' />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const profile = user.profile;

  const hostName = profile?.displayName || user.name || t('unknownHost');
  const profileImage = profile?.image || user.picture;
  const imageUrl = getImageUrl('profile', 'thumb', profileImage);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('hostedByLabel')}</SectionHeader>
      <div className='flex flex-row items-center gap-2.5'>
        <Avatar className='h-6 w-6'>
          {imageUrl && (
            <AvatarImage src={imageUrl} alt={hostName} loading='lazy' />
          )}
          <AvatarFallback className='bg-linear-to-br from-blue-500 to-purple-600' />
        </Avatar>
        <div className='text-zinc-800 dark:text-gray-100 text-base font-medium leading-tight'>
          {hostName}
        </div>
      </div>
    </div>
  );
}
