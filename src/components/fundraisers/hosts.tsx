'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from './typography';

const MAX_STRIP_AVATARS = 5;
const MAX_STRIP_NAMED = 3;

type HostProps =
  | { mode: 'preview' }
  | {
      mode: 'display';
      fundraiser: Fundraiser;
      variant?: 'list' | 'strip';
    };

export function Hosts(props: HostProps) {
  if (props.mode === 'display') {
    return (
      <FundraiserHosts
        fundraiser={props.fundraiser}
        variant={props.variant ?? 'strip'}
      />
    );
  }

  return <HostsPreview />;
}

function SingleHost({
  name,
  avatarUrl,
  seed,
}: {
  name: string;
  avatarUrl: string | null;
  seed: string;
}) {
  return (
    <div className='flex flex-row items-center gap-2.5'>
      <Avatar className='h-6 w-6'>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} loading='lazy' />}
        <FallbackAvatar seed={seed} />
      </Avatar>
      <div className='text-zinc-800 dark:text-gray-100 text-base font-medium leading-tight'>
        {name}
      </div>
    </div>
  );
}

function HostsListDisplay({
  hosts,
  loading = false,
  onCollapse,
}: {
  hosts: Array<{ id?: string; name: string; avatarUrl: string | null }>;
  loading?: boolean;
  onCollapse?: () => void;
}) {
  const t = useTranslations('Fundraisers');

  if (!loading && hosts.length === 0) {
    return null;
  }

  return (
    <>
      <SectionHeader
        className='w-full flex-row justify-between'
        actionSlot={
          onCollapse && (
            <button
              type='button'
              onClick={onCollapse}
              className='p-1 text-muted-foreground hover:text-foreground transition-colors'
            >
              <ChevronUp className='w-4 h-4' />
            </button>
          )
        }
      >
        {t('hostedByLabel')}
      </SectionHeader>
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
              seed={host.id ?? host.name}
            />
          ))
        )}
      </div>
    </>
  );
}

function HostsStripDisplay({
  hosts,
  onToggle,
}: {
  hosts: Array<{ id?: string; name: string; avatarUrl: string | null }>;
  onToggle?: () => void;
}) {
  const t = useTranslations('Fundraisers');
  const format = useFormatter();

  if (hosts.length === 0) return null;

  const avatarHosts = hosts.slice(0, MAX_STRIP_AVATARS);
  const displayNames = hosts
    .slice(0, MAX_STRIP_NAMED)
    .map(h => h.name.split(' ')[0] ?? h.name);
  const hasMore = hosts.length > MAX_STRIP_NAMED;

  let namesText: string;
  if (hasMore) {
    namesText = `${format.list(displayNames, { type: 'conjunction' })} ${t('andMore')}`;
  } else {
    namesText = format.list(displayNames, { type: 'conjunction' });
  }

  const content = (
    <>
      <div className='flex gap-2.5 items-center'>
        <div className='flex items-center shrink-0'>
          {avatarHosts.map((host, index) => (
            <Avatar
              key={host.id ?? index}
              className={cn(
                'w-6 h-6 border-2 border-card',
                index > 0 && '-ml-2'
              )}
              title={host.name}
            >
              {host.avatarUrl && (
                <AvatarImage src={host.avatarUrl} alt='' loading='lazy' />
              )}
              <FallbackAvatar seed={host.id ?? host.name} />
            </Avatar>
          ))}
        </div>
        <div className='text-foreground text-sm font-semibold leading-tight'>
          {t('hostedByLabel')} {namesText}
        </div>
      </div>
      {onToggle && (
        <ChevronDown className='w-4 h-4 shrink-0 text-muted-foreground' />
      )}
    </>
  );

  if (onToggle) {
    return (
      <button
        type='button'
        onClick={onToggle}
        className='flex justify-between items-center gap-2.5 text-left'
      >
        {content}
      </button>
    );
  }

  return <div className='flex items-center gap-2.5'>{content}</div>;
}

function FundraiserHosts({
  fundraiser,
  variant,
}: {
  fundraiser: Fundraiser;
  variant: 'list' | 'strip';
}) {
  const t = useTranslations('Fundraisers');
  const [expanded, setExpanded] = useState(variant === 'list');

  const publicHosts = fundraiser.hosts.filter(host => host.isPublic);
  const hostsToShow = publicHosts.length > 0 ? publicHosts : fundraiser.hosts;

  const hosts = hostsToShow.map(host => ({
    id: host.id,
    name: host.displayName ?? host.user?.name ?? t('unknownHost'),
    avatarUrl: host.user?.avatar
      ? getImageUrl('profile', 'thumb', host.user.avatar)
      : null,
  }));

  if (variant === 'strip') {
    if (expanded && hosts.length > 1) {
      return (
        <HostsListDisplay hosts={hosts} onCollapse={() => setExpanded(false)} />
      );
    }
    return (
      <HostsStripDisplay
        hosts={hosts}
        onToggle={hosts.length > 1 ? () => setExpanded(true) : undefined}
      />
    );
  }

  return <HostsListDisplay hosts={hosts} />;
}

function HostsPreview() {
  const t = useTranslations('Fundraisers');

  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  if (isAuthInitializing) {
    return <HostsListDisplay hosts={[]} loading />;
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

  return <HostsStripDisplay hosts={[{ name, avatarUrl }]} />;
}
