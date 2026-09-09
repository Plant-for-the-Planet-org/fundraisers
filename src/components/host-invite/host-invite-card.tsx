'use client';

import type { HostInviteLookup } from '@/lib/api/host-invite-service';
import type { HostInvite } from '@/lib/types/host-invite';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { CalendarClock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  acceptHostInvite,
  declineHostInvite,
} from '@/lib/api/host-invite-service';
import { isHostInviteLapsed } from '@/lib/utils/host-invite';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * What the reader is shown. `pending` is the only one with anything to decide; the rest are
 * outcomes, including the two that are not invitation states at all — a link that resolves to
 * nothing, and a request that failed on the way.
 */
type View =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'invalid'
  | 'error';

function viewFor(lookup: HostInviteLookup): View {
  if (lookup.kind === 'found') return viewForInvite(lookup.invite);

  // A 404 is the ordinary case for a token replaced by a newer invitation, a link copied short, or
  // a platform where co-host invitations are not switched on yet — not an outage.
  return lookup.kind === 'not-found' ? 'invalid' : 'error';
}

/**
 * A pending invitation whose deadline has passed is shown as expired: the platform only writes the
 * `expired` state in a daily sweep, so until then answering it fails with a 409 and the actions
 * would lead nowhere.
 */
function viewForInvite(invite: HostInvite): View {
  return isHostInviteLapsed(invite) ? 'expired' : invite.state;
}

interface HostInviteCardProps {
  token: string;
  /** Read on the server, so the invitation is in the first HTML rather than behind a spinner. */
  lookup: HostInviteLookup;
  /** `decline` comes from the smaller link in the email. It moves focus, nothing more. */
  intent?: string;
}

export function HostInviteCard({ token, lookup, intent }: HostInviteCardProps) {
  const t = useTranslations('HostInvite');
  const format = useFormatter();
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // What the server sent is the truth until this page learns otherwise, which only happens when the
  // platform refuses an answer because the invitation had already moved on. Held as an override
  // rather than copied into state, so a router.refresh() flows straight through.
  const [answered, setAnswered] = useState<{
    view: View;
    invite: HostInvite | null;
  } | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isRetrying, startRetry] = useTransition();
  const declineRef = useRef<HTMLButtonElement>(null);

  const view = answered?.view ?? viewFor(lookup);
  const invite =
    answered?.invite ?? (lookup.kind === 'found' ? lookup.invite : null);

  // Re-reading is the server's job: refresh() re-runs the page, which fetches the invitation again
  // and sends down a new `lookup`.
  const retry = () => {
    setAnswered(null);
    startRetry(() => router.refresh());
  };

  useEffect(() => {
    if (view === 'pending' && intent === 'decline') {
      declineRef.current?.focus();
    }
  }, [view, intent]);

  const answer = async (choice: 'accept' | 'decline') => {
    setIsAnswering(true);

    const result = await (choice === 'accept'
      ? acceptHostInvite(token)
      : declineHostInvite(token));

    if (result.kind === 'answered') {
      const slug = result.invite.fundraiser.slug;
      // The fundraiser page owns the confirmation, so the outcome travels as a parameter it knows
      // how to render. Without a slug there is nowhere to send them but the dashboard.
      router.replace(
        slug
          ? `/raise/${slug}?hostInvite=${choice === 'accept' ? 'accepted' : 'declined'}`
          : '/dashboard'
      );
      return;
    }

    setIsAnswering(false);

    // The invitation moved on while this page was open: someone answered it in another tab, or its
    // deadline passed. Show what it actually says rather than an error.
    if (result.kind === 'conflict') {
      setAnswered(
        result.invite
          ? {
              // A refusal on an invitation that still reads as pending means its deadline passed
              // before the sweep caught up, so it is expired rather than answerable.
              view:
                result.invite.state === 'pending'
                  ? 'expired'
                  : result.invite.state,
              invite: result.invite,
            }
          : { view: 'error', invite: null }
      );
      return;
    }

    if (result.kind === 'not-found') {
      setAnswered({ view: 'invalid', invite: null });
      return;
    }

    toast.error(t('error.title'));
  };

  const fundraiserTitle = invite?.fundraiser.title ?? '';
  const fundraiserHref = invite?.fundraiser.slug
    ? `/raise/${invite.fundraiser.slug}`
    : '/explore';

  if (view === 'pending' && invite) {
    return (
      <Shell>
        <CardHeader className='gap-1.5 text-center'>
          <p className='text-sm font-medium text-primary'>
            {invite.inviterName
              ? t('pending.eyebrowWithInviter', { inviter: invite.inviterName })
              : t('pending.eyebrow')}
          </p>
          <CardTitle className='text-xl lg:text-2xl'>
            {t('pending.title', { fundraiser: fundraiserTitle })}
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-5'>
          <ul className='flex flex-col gap-2.5 text-sm text-muted-foreground'>
            <li className='flex items-start gap-2.5'>
              {invite.isPublic ? (
                <Eye size={16} className='mt-0.5 shrink-0' />
              ) : (
                <EyeOff size={16} className='mt-0.5 shrink-0' />
              )}
              <span>
                {invite.role === 'viewer'
                  ? t('pending.roleViewer')
                  : t('pending.roleAdmin')}{' '}
                {invite.isPublic
                  ? t('pending.publicYes')
                  : t('pending.publicNo')}
              </span>
            </li>
            {invite.expiresAt && (
              <li className='flex items-start gap-2.5'>
                <CalendarClock size={16} className='mt-0.5 shrink-0' />
                <span>
                  {t('pending.expires', {
                    date: format.dateTime(new Date(invite.expiresAt), {
                      dateStyle: 'long',
                    }),
                  })}
                </span>
              </li>
            )}
          </ul>

          <div className='flex flex-col gap-2.5'>
            <Button
              className='w-full'
              disabled={isAnswering}
              onClick={() => void answer('accept')}
            >
              {isAnswering && <Loader2 className='animate-spin' size={16} />}
              {isAnswering ? t('pending.answering') : t('pending.accept')}
            </Button>
            <Button
              ref={declineRef}
              variant='outline'
              className='w-full'
              disabled={isAnswering}
              onClick={() => void answer('decline')}
            >
              {t('pending.decline')}
            </Button>
            <Button variant='text' asChild className='w-full'>
              <Link href={fundraiserHref}>{t('pending.viewFundraiser')}</Link>
            </Button>
          </div>

          {invite.invitedEmail && (
            <p className='text-center text-xs text-muted-foreground'>
              {t('pending.invitedAs', { email: invite.invitedEmail })}
            </p>
          )}
        </CardContent>
      </Shell>
    );
  }

  if (view === 'error') {
    return (
      <Outcome
        title={t('error.title')}
        description={t('error.description')}
        action={
          <Button className='w-full' disabled={isRetrying} onClick={retry}>
            {isRetrying && <Loader2 className='animate-spin' size={16} />}
            {isRetrying ? t('loading') : t('error.cta')}
          </Button>
        }
      />
    );
  }

  if (view === 'accepted') {
    return (
      <Outcome
        title={t('accepted.title')}
        description={t('accepted.description', { fundraiser: fundraiserTitle })}
        action={
          <Button asChild className='w-full'>
            <Link
              href={
                isAuthenticated ? '/dashboard' : '/login?redirectTo=/dashboard'
              }
            >
              {isAuthenticated ? t('accepted.cta') : t('accepted.ctaSignedOut')}
            </Link>
          </Button>
        }
      />
    );
  }

  if (view === 'declined') {
    return (
      <Outcome
        title={t('declined.title')}
        description={t('declined.description', { fundraiser: fundraiserTitle })}
        action={
          <Button variant='outline' asChild className='w-full'>
            <Link href={fundraiserHref}>{t('declined.cta')}</Link>
          </Button>
        }
      />
    );
  }

  if (view === 'expired') {
    return (
      <Outcome
        title={t('expired.title')}
        description={t('expired.description', { fundraiser: fundraiserTitle })}
        action={
          <Button variant='outline' asChild className='w-full'>
            <Link href={fundraiserHref}>{t('expired.cta')}</Link>
          </Button>
        }
      />
    );
  }

  // Everything left is a link that resolves to nothing: an unknown token, one replaced by a
  // resend, or a platform where co-host invitations are not switched on yet. A reader cannot act
  // on the difference, so all three read the same.
  return (
    <Outcome
      title={t('invalid.title')}
      description={t('invalid.description')}
      action={
        <Button variant='outline' asChild className='w-full'>
          <Link href='/explore'>{t('invalid.cta')}</Link>
        </Button>
      }
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card className='w-full max-w-md border-2 border-card shadow rounded-2xl'>
      {children}
    </Card>
  );
}

function Outcome({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <Shell>
      <CardHeader className='text-center'>
        <CardTitle className='text-xl lg:text-2xl'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <p className='text-center text-sm text-muted-foreground lg:text-base'>
          {description}
        </p>
        {action}
      </CardContent>
    </Shell>
  );
}
