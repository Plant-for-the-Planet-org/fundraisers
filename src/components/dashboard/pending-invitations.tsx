'use client';

import type { PendingHostInvite } from '@/lib/types/host-invite';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  listMyHostInvites,
  respondToHostInvite,
} from '@/lib/api/host-invite-service';
import { isHostInviteLapsed } from '@/lib/utils/host-invite';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraisersStore } from '@/stores/hosted-fundraisers-store';
import { HostInvitePending } from '@/components/host-invite/host-invite-pending';

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
  const accessToken = useAuthStore(state => state.accessToken);

  const [invites, setInvites] = useState<PendingHostInvite[]>([]);
  const [answering, setAnswering] = useState<string | null>(null);

  const load = useCallback(
    async (token: string, signal: { aborted: boolean }) => {
      const result = await listMyHostInvites(token);
      if (signal.aborted) return;
      // A failed read shows nothing rather than a stale list that may belong to a previous session.
      if (result === null) {
        setInvites([]);
        return;
      }
      // An invitation past its deadline still reads as pending until the platform's daily sweep, and answering it would only fail. Leave those out rather than offering actions that lead nowhere.
      setInvites(result.filter(invite => !isHostInviteLapsed(invite)));
    },
    []
  );

  useEffect(() => {
    // The list belongs to one identity. Whoever is signed in now starts from an empty list, so nothing from a previous session shows while theirs loads, and a sign-out clears it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvites([]);
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
    // The deadline can pass while the dashboard stays open. Answering then only fails, so the row goes instead.
    if (isHostInviteLapsed(invite)) {
      setInvites(current => current.filter(row => row.id !== invite.id));
      toast.error(t('expiredToast'));
      return;
    }
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

  // Drop each row the moment its deadline passes, so no dead buttons stay on screen while the dashboard is open.
  useEffect(() => {
    const next = invites
      .map(invite =>
        invite.expiresAt ? new Date(invite.expiresAt).getTime() : NaN
      )
      .filter(time => Number.isFinite(time) && time > Date.now())
      .sort((a, b) => a - b)[0];
    if (next === undefined) return;
    const timer = setTimeout(
      () =>
        setInvites(current => current.filter(row => !isHostInviteLapsed(row))),
      Math.min(next - Date.now() + 1000, 2 ** 31 - 1)
    );
    return () => clearTimeout(timer);
  }, [invites]);

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
            className='flex flex-col gap-4 rounded-xl border-2 border-card bg-card p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8'
          >
            <HostInvitePending
              layout='card'
              invite={invite}
              heading={
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
              }
              isAnswering={answering === invite.id}
              onAccept={() => void answer(invite, 'accept')}
              onDecline={() => void answer(invite, 'decline')}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
