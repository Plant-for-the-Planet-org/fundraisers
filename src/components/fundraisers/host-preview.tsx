'use client';

import { useTranslations } from 'next-intl';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl } from '@/lib/utils/images';
import { SectionHeader } from './typography';
import { useAuthStore } from '@/stores/authStore';

interface HostPreviewProps {
  mode?: 'read' | 'write';
  fundraiser?: Fundraiser;
}

export function HostPreview({ mode = 'write', fundraiser }: HostPreviewProps) {
  if (mode === 'read') {
    return <HostPreviewRead fundraiser={fundraiser} />;
  }

  return <HostPreviewWrite />;
}

function HostPreviewRead({ fundraiser }: { fundraiser?: Fundraiser }) {
  const t = useTranslations('Fundraisers');

  if (!fundraiser) {
    return null;
  }

  const publicHosts = fundraiser.hosts.filter(host => host.isPublic);
  const hostsToShow = publicHosts.length > 0 ? publicHosts : fundraiser.hosts;

  if (hostsToShow.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('hostedByLabel')}</SectionHeader>
      <div className='flex flex-col gap-2'>
        {hostsToShow.map(host => {
          const hostName =
            host.displayName ?? host.user?.name ?? t('unknownHost');
          const avatarUrl = host.user?.avatar
            ? getImageUrl('profile', 'thumb', host.user.avatar)
            : null;
          return (
            <div key={host.id} className='flex flex-row items-center gap-2.5'>
              <Avatar className='h-6 w-6'>
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={hostName} loading='lazy' />
                )}
                <AvatarFallback className='bg-linear-to-br from-blue-500 to-purple-600' />
              </Avatar>
              <div className='text-zinc-800 dark:text-gray-100 text-base font-medium leading-tight'>
                {hostName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HostPreviewWrite() {
  const t = useTranslations('Fundraisers');

  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  if (isAuthInitializing) {
    return (
      <div className='flex flex-col gap-3'>
        <SectionHeader>{t('hostedByLabel')}</SectionHeader>
        <div className='flex flex-row items-center gap-2.5'>
          <Skeleton className='h-6 w-6 rounded-full' />
          <Skeleton className='h-6 w-32' />
        </div>
      </div>
    );
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
