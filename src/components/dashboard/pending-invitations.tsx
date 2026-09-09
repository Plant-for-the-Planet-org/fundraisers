'use client';

import type { PendingHostInvite } from '@/lib/types/host-invite';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { CalendarClock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listMyHostInvites,
  respondToHostInvite,
} from '@/lib/api/host-invite-service';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraisersStore } from '@/stores/hosted-fundraisers-store';
import { Button } from '@/components/ui/button';

interface PendingInvitationsProps {
  /** Called after an acceptance, because the fundraiser list below only contains fundraisers where you are already an active host. */
  onAccepted: () => void;
}

/**
 * Invitations to co-host, waiting for an answer, above the fundraiser list.
 *
 * Someone who already has an account should not have to go back to their inbox to accept, and most Planet staff will only ever use this path. The email becomes a nudge rather than the only door in.
 *
 * Renders nothing at all when there is nothing pending, which is the normal case. That is also what a failure looks like: an invitation strip is not worth putting an error on someone's dashboard over, and while the platform's opt-in flag is off the endpoint answers 404, which is simply "nothing pending" for now.
 */
export function PendingInvitations({ onAccepted }: PendingInvitationsProps) {
  const t = useTranslations('HostInvite.dashboard');
  const format = useFormatter();
  const accessToken = useAuthStore(state => state.accessToken);

  const [invites, setInvites] = useState<PendingHostInvite[]>([]);
  const [answering, setAnswering] = useState<string | null>(null);

  const load = useCallback(
    async (token: string, signal: { aborted: boolean }) => {
      const result = await listMyHostInvites(token);
      if (signal.aborted || result === null) return;
      setInvites(result);
    },
    []
  );

  useEffect(() => {
    if (!accessToken) return;

    const signal = { aborted: false };
    // The lint rule wants state to change through an external store rather than from an effect, and
    // there is no way to satisfy it for a client-side fetch without a data library this app does
    // not use. The dashboard's own fundraiser fetch, two components up, does exactly this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(accessToken, signal);

    return () => {
      signal.aborted = true;
    };
  }, [accessToken, load]);

  const answer = async (
    invite: PendingHostInvite,
    choice: 'accept' | 'decline'
  ) => {
    if (!accessToken) return;
    setAnswering(invite.id);

    const result = await respondToHostInvite(invite.id, choice, accessToken);
    setAnswering(null);

    if (result.kind === 'error') {
      toast.error(t('answerFailed'));
      return;
    }

    // Answered, or answered elsewhere while this was open, or gone. All three mean it should leave
    // the strip; only the first is worth congratulating anybody about.
    setInvites(current => current.filter(i => i.id !== invite.id));

    if (result.kind !== 'answered') return;

    if (choice === 'accept') {
      // Both caches key off which fundraisers this person hosts, and that just changed.
      useHostedFundraisersStore.getState().reset();
      onAccepted();
      toast.success(
        t('acceptedToast', { fundraiser: invite.fundraiser.title ?? '' })
      );
    } else {
      toast.success(t('declinedToast'));
    }
  };

  if (invites.length === 0) return null;

  return (
    <section className='space-y-3'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold text-foreground'>
          {t('title', { count: invites.length })}
        </h2>
        <p className='text-sm text-muted-foreground'>{t('subtitle')}</p>
      </div>

      <ul className='flex flex-col gap-2.5'>
        {invites.map(invite => (
          <li
            key={invite.id}
            className='flex flex-col gap-3 rounded-xl border-2 border-card bg-card p-4 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='flex min-w-0 flex-col gap-1'>
              <p className='truncate font-medium text-foreground'>
                {invite.fundraiser.slug ? (
                  <Link
                    href={`/raise/${invite.fundraiser.slug}`}
                    className='hover:underline'
                  >
                    {invite.fundraiser.title}
                  </Link>
                ) : (
                  invite.fundraiser.title
                )}
              </p>
              <p className='text-sm text-muted-foreground'>
                {invite.inviterName
                  ? t('invitedBy', { inviter: invite.inviterName })
                  : t('invited')}
              </p>
              <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                <span className='inline-flex items-center gap-1.5'>
                  {invite.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
                  {invite.role === 'viewer' ? t('roleViewer') : t('roleAdmin')}
                  {invite.isPublic ? ` · ${t('nameShown')}` : ''}
                </span>
                {invite.expiresAt && (
                  <span className='inline-flex items-center gap-1.5'>
                    <CalendarClock size={13} />
                    {t('expires', {
                      date: format.dateTime(new Date(invite.expiresAt), {
                        dateStyle: 'medium',
                      }),
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className='flex shrink-0 gap-2'>
              <Button
                size='sm'
                disabled={answering === invite.id}
                onClick={() => void answer(invite, 'accept')}
              >
                {answering === invite.id && (
                  <Loader2 className='animate-spin' size={14} />
                )}
                {t('accept')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                disabled={answering === invite.id}
                onClick={() => void answer(invite, 'decline')}
              >
                {t('decline')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
