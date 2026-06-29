'use client';

import type { FundraiserHost } from '@/lib/types/fundraiser';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EyeOff, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { listFundraiserHosts } from '@/lib/api/fundraiser-hosts-service';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { ManageHostsDialog } from './manage-hosts-dialog';
import { SectionHeader } from './typography';

interface HostsManagerProps {
  fundraiserId: string;
  initialHosts: FundraiserHost[];
}

/** Order by displayOrder (nulls last), preserving incoming order on ties. */
function sortByDisplayOrder(hosts: FundraiserHost[]): FundraiserHost[] {
  return hosts
    .map((host, index) => ({ host, index }))
    .sort((a, b) => {
      const ao = a.host.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.host.displayOrder ?? Number.MAX_SAFE_INTEGER;
      return ao - bo || a.index - b.index;
    })
    .map(entry => entry.host);
}

/**
 * Edit-mode replacement for the read-only `<Hosts mode="preview" />`. Shows the
 * fundraiser's actual hosts plus a borderless settings icon (beside the header)
 * that opens the management dialog. Host mutations are immediate (independent
 * of the fundraiser form), so
 * local state is the live source while the dialog is open.
 */
export function HostsManager({
  fundraiserId,
  initialHosts,
}: HostsManagerProps) {
  const t = useTranslations('Fundraisers.form.hosts');
  const accessToken = useAuthStore(state => state.accessToken);
  const [hosts, setHosts] = useState<FundraiserHost[]>(() =>
    sortByDisplayOrder(initialHosts)
  );
  const [open, setOpen] = useState(false);

  // The fundraiser payload only carries public + active hosts (its `hosts`
  // field is filtered server-side). Management needs the full set — invited
  // and private hosts included — so load it from the dedicated hosts endpoint,
  // which also returns `invitedEmail` for admins. `initialHosts` renders
  // immediately; this replaces it once the complete list arrives. Falls back to
  // the public subset if the request fails.
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    listFundraiserHosts(fundraiserId, accessToken)
      .then(fullHosts => {
        if (active) setHosts(sortByDisplayOrder(fullHosts));
      })
      .catch(err => {
        console.error('Loading fundraiser hosts failed:', err);
        toast.warning(t('toastHostsLoadFailed'));
      });
    return () => {
      active = false;
    };
  }, [fundraiserId, accessToken, t]);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={
          <button
            type='button'
            onClick={() => setOpen(true)}
            aria-label={t('manage')}
            title={t('manage')}
            className='text-muted-foreground transition-colors hover:text-foreground'
          >
            <Settings2 size={16} />
          </button>
        }
      >
        {t('title')}
      </SectionHeader>

      <div className='flex flex-col gap-2'>
        {hosts.map(host => {
          const name =
            host.displayName ??
            host.user?.name ??
            host.invitedEmail ??
            t('unknownHost');
          const avatarUrl = host.user?.avatar
            ? getImageUrl('profile', 'thumb', host.user.avatar)
            : null;
          return (
            <div
              key={host.id}
              className={cn(
                'flex items-center gap-2.5',
                !host.isPublic && 'opacity-60'
              )}
            >
              <Avatar className='h-6 w-6'>
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={name} loading='lazy' />
                )}
                <FallbackAvatar seed={host.id} />
              </Avatar>
              <span className='truncate text-base font-medium leading-tight text-zinc-800 dark:text-gray-100'>
                {name}
              </span>
              {!host.isPublic && (
                <EyeOff
                  size={14}
                  className='shrink-0 text-muted-foreground'
                  aria-label={t('visibilityOff')}
                />
              )}
              {host.status === 'invited' && (
                <span className='text-xs font-medium text-amber-600 dark:text-amber-500'>
                  {t('invited')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <ManageHostsDialog
        open={open}
        onOpenChange={setOpen}
        fundraiserId={fundraiserId}
        hosts={hosts}
        onHostsChange={setHosts}
      />
    </div>
  );
}
