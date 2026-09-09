'use client';

import type { ReactNode, Ref } from 'react';
import type { HostInvite } from '@/lib/types/host-invite';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HostInviteFacts } from '@/components/host-invite/host-invite-facts';
import { Button } from '@/components/ui/button';

interface HostInvitePendingProps {
  invite: Pick<
    HostInvite,
    'role' | 'isPublic' | 'expiresAt' | 'invitedEmail' | 'inviterName'
  >;
  /** Named above the eyebrow when the fundraiser is not otherwise visible, as on the dashboard. */
  heading?: ReactNode;
  /** The dashboard already is the invited person's own account, so it leaves the address out. */
  showEmail?: boolean;
  /** `bar` puts the buttons in a column beside the text on desktop; `card` keeps a compact row. */
  layout?: 'bar' | 'card';
  isAnswering: boolean;
  onAccept: () => void;
  onDecline: () => void;
  declineRef?: Ref<HTMLButtonElement>;
}

/**
 * A pending co-host invitation: who asked, the facts, and the two answers. Shared by the invitation bar on the fundraiser page and the dashboard card so both read and behave the same.
 */
export function HostInvitePending({
  invite,
  heading,
  showEmail = false,
  layout = 'bar',
  isAnswering,
  onAccept,
  onDecline,
  declineRef,
}: HostInvitePendingProps) {
  const t = useTranslations('HostInvite.pending');
  const compact = layout === 'card';

  return (
    <>
      <div className='flex min-w-0 flex-col gap-2.5'>
        {heading}
        <p
          className='text-sm font-medium'
          style={{ color: 'var(--accent-color, hsl(var(--primary)))' }}
        >
          {invite.inviterName
            ? t('eyebrowWithInviter', { inviter: invite.inviterName })
            : t('eyebrow')}
        </p>
        <HostInviteFacts
          invite={invite}
          showEmail={showEmail}
          className={cn(compact && 'text-xs')}
        />
      </div>

      <div
        className={cn(
          'flex shrink-0 flex-wrap gap-2',
          !compact && 'lg:w-52 lg:flex-col'
        )}
      >
        <Button
          ref={declineRef}
          variant='outline'
          size={compact ? 'sm' : 'default'}
          className={cn(compact ? 'min-w-28' : 'min-w-40 lg:w-full')}
          disabled={isAnswering}
          onClick={onDecline}
        >
          {t('decline')}
        </Button>
        <Button
          size={compact ? 'sm' : 'default'}
          className={cn(
            'text-white hover:opacity-90',
            compact ? 'min-w-28' : 'min-w-40 lg:w-full'
          )}
          // Same as the video consent button: the fundraiser's accent, falling back to the app colour outside a theme.
          style={{
            backgroundColor: 'var(--accent-color, hsl(var(--primary)))',
          }}
          disabled={isAnswering}
          onClick={onAccept}
        >
          {isAnswering && <Loader2 className='animate-spin' size={16} />}
          {isAnswering ? t('answering') : t('accept')}
        </Button>
      </div>
    </>
  );
}
