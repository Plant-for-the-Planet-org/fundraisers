'use client';

import type { Fundraiser, FundraiserHost } from '@/lib/types/fundraiser';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { listFundraiserHosts } from '@/lib/api/fundraiser-hosts-service';
import { cn } from '@/lib/utils/cn';
import { getImageUrl } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { ManageHostsDialog } from '@/components/fundraisers/manage-hosts-dialog';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { PlusIcon } from '@/components/ui/ui-icons';

function hostName(host: FundraiserHost, unknown: string) {
  return host.displayName ?? host.user?.name ?? host.invitedEmail ?? unknown;
}

interface FundraiserHostsCardProps {
  fundraiser: Fundraiser;
  /** Only owners and admins can invite or manage hosts. */
  canEdit: boolean;
  /** The manage dialog is controlled by the page, so the checklist's "Invite a co-host" step can open it too. */
  dialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
}

export function FundraiserHostsCard({
  fundraiser,
  canEdit,
  dialogOpen,
  onDialogOpenChange,
}: FundraiserHostsCardProps) {
  const t = useTranslations('Fundraisers.form.hosts');
  const tCard = useTranslations('Dashboard.fundraiser.hosts');
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUserId = useAuthStore(state => state.user?.sub);
  const [hosts, setHosts] = useState<FundraiserHost[]>(fundraiser.hosts);

  // The fundraiser payload only carries public, active hosts. Invited and private hosts come from the hosts endpoint, the same one the editor uses.
  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;
    listFundraiserHosts(fundraiser.id, accessToken)
      .then(fullHosts => {
        if (!ignore) setHosts(fullHosts);
      })
      .catch(error => {
        // The public list is already on screen, so a failed read only means invited hosts are missing.
        console.error('[FundraiserHostsCard] Failed to load hosts:', error);
      });
    return () => {
      ignore = true;
    };
  }, [fundraiser.id, accessToken]);

  // Declined and expired invitations are history, not hosts. The dialog still lists them for resending.
  const visibleHosts = hosts.filter(
    host => host.status === 'active' || host.status === 'invited'
  );

  return (
    <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
      <div className='flex items-center justify-between gap-4'>
        <h2 className='text-lg font-semibold text-foreground'>{t('title')}</h2>
        {canEdit && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => onDialogOpenChange(true)}
          >
            <PlusIcon />
            {tCard('invite')}
          </Button>
        )}
      </div>

      <ul className='m-0 flex list-none flex-col divide-y divide-border p-0'>
        {visibleHosts.map(host => {
          const name = hostName(host, t('unknownHost'));
          const avatarUrl = host.user?.avatar
            ? getImageUrl('profile', 'thumb', host.user.avatar)
            : null;
          const isInvited = host.status === 'invited';
          const isYou = !!currentUserId && host.user?.id === currentUserId;

          return (
            <li key={host.id} className='flex items-center gap-3 py-2.5'>
              <Avatar className={cn('size-8', isInvited && 'opacity-60')}>
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={name} loading='lazy' />
                )}
                <FallbackAvatar seed={host.id} />
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-foreground'>
                  {name}
                  {isYou && (
                    <span className='ml-1 font-normal text-muted-foreground'>
                      {t('you')}
                    </span>
                  )}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {host.role === 'viewer' ? t('roleViewer') : t('roleAdmin')}
                  {!host.isPublic && ` · ${t('visibilityOff')}`}
                </p>
              </div>
              {isInvited && (
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                  {t('invited')}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {canEdit && (
        <ManageHostsDialog
          open={dialogOpen}
          onOpenChange={onDialogOpenChange}
          fundraiserId={fundraiser.id}
          hosts={hosts}
          onHostsChange={setHosts}
        />
      )}
    </Card>
  );
}
