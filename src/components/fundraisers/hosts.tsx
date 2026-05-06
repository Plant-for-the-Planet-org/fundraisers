'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useTranslations } from 'next-intl';
import { getImageUrl } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from './typography';

type HostProps =
  | { mode: 'preview' }
  | { mode: 'display'; fundraiser: Fundraiser };

export function Hosts(props: HostProps) {
  if (props.mode === 'display') {
    return <FundraiserHosts fundraiser={props.fundraiser} />;
  }

  return <HostsPreview />;
}

function SingleHost({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className='flex flex-row items-center gap-2.5'>
      <Avatar className='h-6 w-6'>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} loading='lazy' />}
        <AvatarFallback className='bg-linear-to-br from-blue-500 to-purple-600' />
      </Avatar>
      <div className='text-zinc-800 dark:text-gray-100 text-base font-medium leading-tight'>
        {name}
      </div>
    </div>
  );
}

function HostsDisplay({
  hosts,
  loading = false,
}: {
  hosts: Array<{ id?: string; name: string; avatarUrl: string | null }>;
  loading?: boolean;
}) {
  const t = useTranslations('Fundraisers');

  if (!loading && hosts.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('hostedByLabel')}</SectionHeader>
      <div className='flex flex-col gap-2'>
        {loading ? (
          <div className='flex flex-row items-center gap-2.5'>
            <Skeleton className='h-6 w-6 rounded-full' />
            <Skeleton className='h-6 w-32' />
          </div>
        ) : (
          hosts.map((host, i) => (
            <SingleHost
              key={host.id ?? i}
              name={host.name}
              avatarUrl={host.avatarUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FundraiserHosts({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Fundraisers');

  const publicHosts = fundraiser.hosts.filter(host => host.isPublic);
  const hostsToShow = publicHosts.length > 0 ? publicHosts : fundraiser.hosts;

  const hosts = hostsToShow.map(host => ({
    id: host.id,
    name: host.displayName ?? host.user?.name ?? t('unknownHost'),
    avatarUrl: host.user?.avatar
      ? getImageUrl('profile', 'thumb', host.user.avatar)
      : null,
  }));

  return <HostsDisplay hosts={hosts} />;
}

function HostsPreview() {
  const t = useTranslations('Fundraisers');

  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  if (isAuthInitializing) {
    return <HostsDisplay hosts={[]} loading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const profile = user.profile;
  const name = profile?.displayName || user.name || t('unknownHost');
  const avatarUrl = getImageUrl(
    'profile',
    'thumb',
    profile?.image || user.picture
  );

  return <HostsDisplay hosts={[{ name, avatarUrl }]} />;
}
