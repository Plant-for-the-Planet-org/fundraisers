'use client';

import type {
  HostInviteAnswer,
  HostInviteLookup,
} from '@/lib/api/host-invite-service';
import type { HostInvite } from '@/lib/types/host-invite';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Link2Off,
  Loader2,
  UserX,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  declineHostInvite,
  listMyHostInvites,
  respondToHostInvite,
} from '@/lib/api/host-invite-service';
import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { cn } from '@/lib/utils';
import {
  isHostInviteLapsed,
  maskedEmailMayMatch,
} from '@/lib/utils/host-invite';
import { useAuthStore } from '@/stores/auth-store';
import { HostInvitePending } from '@/components/host-invite/host-invite-pending';
import { Button } from '@/components/ui/button';

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
  | 'wrongAccount'
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

interface HostInviteBarProps {
  token: string;
  /**
   * Read on the server and already resolved for the fundraiser this bar sits on: a found
   * invitation for a different fundraiser reads the same as one that was never found.
   */
  lookup: HostInviteLookup;
  /** `decline` comes from the smaller link in the email. It moves focus, nothing more. */
  intent?: string;
}

/**
 * A full-width bar for answering a co-host invitation, shown above the fundraiser it invites to.
 * The fundraiser's own cover and title already sit right below it, so this only carries what the
 * invitation itself adds: who is asking, what the role means, and the deadline.
 */
export function HostInviteBar({ token, lookup, intent }: HostInviteBarProps) {
  const t = useTranslations('HostInvite');
  // A declined, expired or invalid invitation has nothing left to do here; the fundraiser is right below, so the bar just goes away.
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const accessToken = useAuthStore(state => state.accessToken);
  const userEmail = useAuthStore(state => state.user?.email);
  const logout = useAuthStore(state => state.logout);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // What the server sent is the truth until this page learns otherwise, which only happens when
  // the platform refuses an answer because the invitation had already moved on. Held as an
  // override rather than copied into state, so a router.refresh() flows straight through.
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

  const query = searchParams.toString();
  const currentPath = query ? `${pathname}?${query}` : pathname;

  // Accepting needs a session. When the platform asks for one, the visitor goes to sign in and comes back here with `intent=accept`, and the acceptance they already asked for is finished for them. Once only: a second refusal is shown, not looped back to sign-in.
  const resumedAccept = useRef(false);
  const signInToAccept = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('intent', 'accept');
    router.push(getSignInPath(`${pathname}?${params.toString()}`));
  };

  const answer = async (choice: 'accept' | 'decline') => {
    setIsAnswering(true);

    // Two doors, by design of the platform. Declining needs no account and goes through the token route with no bearer. Accepting binds a person to the fundraiser, so it goes through the session: the signed-in visitor's own pending invitations name the row to answer, and an invitation for this fundraiser that is not in that list belongs to another account.
    let result: HostInviteAnswer;
    if (choice === 'decline') {
      result = await declineHostInvite(token);
    } else {
      if (!accessToken) {
        setIsAnswering(false);
        signInToAccept();
        return;
      }

      const mine = await listMyHostInvites(accessToken);
      if (mine === null) {
        setIsAnswering(false);
        toast.error(t('error.title'));
        return;
      }

      // The token lookup carries no row id, so the signed-in visitor's own pending row for this fundraiser stands in for it. The masked address on the token rules out the case where this account holds a different invitation for the same fundraiser than the link was sent for.
      const addressedToMe =
        !invite?.invitedEmail ||
        !userEmail ||
        maskedEmailMayMatch(invite.invitedEmail, userEmail);
      // The platform allows one host row per address and fundraiser, so for the signed-in account the fundraiser identifies the row. Role, visibility and deadline are compared as well as a cheap guard; both reads are live, so they agree for the same row.
      const own =
        addressedToMe && invite
          ? mine.find(
              candidate =>
                ((invite.fundraiser.id != null &&
                  candidate.fundraiser.id === invite.fundraiser.id) ||
                  (invite.fundraiser.slug != null &&
                    candidate.fundraiser.slug === invite.fundraiser.slug)) &&
                candidate.role === invite.role &&
                candidate.isPublic === invite.isPublic &&
                candidate.expiresAt === invite.expiresAt
            )
          : undefined;
      if (!own) {
        setIsAnswering(false);
        setAnswered({ view: 'wrongAccount', invite });
        return;
      }

      result = await respondToHostInvite(own.id, 'accept', accessToken);
    }

    if (result.kind === 'forbidden') {
      setIsAnswering(false);
      setAnswered({ view: 'wrongAccount', invite });
      return;
    }

    if (result.kind === 'unauthorized') {
      setIsAnswering(false);
      if (choice === 'accept' && !resumedAccept.current) {
        signInToAccept();
        return;
      }
      toast.error(t('error.title'));
      return;
    }

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

  useEffect(() => {
    if (
      view !== 'pending' ||
      intent !== 'accept' ||
      !isAuthenticated ||
      !accessToken ||
      resumedAccept.current
    ) {
      return;
    }
    resumedAccept.current = true;
    void answer('accept');
    // `answer` is recreated every render; the ref makes this a single attempt per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, intent, isAuthenticated, accessToken]);

  if (dismissed) return null;

  if (view === 'pending' && invite) {
    return (
      <Shell>
        <HostInvitePending
          invite={invite}
          showEmail
          isAnswering={isAnswering}
          onAccept={() => void answer('accept')}
          onDecline={() => void answer('decline')}
          declineRef={declineRef}
        />
      </Shell>
    );
  }

  if (view === 'error') {
    return (
      <Outcome
        icon={<AlertTriangle size={20} />}
        title={t('error.title')}
        description={t('error.description')}
        action={
          <Button disabled={isRetrying} onClick={retry}>
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
        icon={
          <CheckCircle2 size={20} style={{ color: 'var(--accent-color)' }} />
        }
        title={t('accepted.title')}
        description={t('accepted.description')}
        action={
          <Button
            asChild
            className='text-white hover:opacity-90'
            style={{
              backgroundColor: 'var(--accent-color, hsl(var(--primary)))',
            }}
          >
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
        icon={<Info size={20} />}
        title={t('declined.title')}
        description={t('declined.description')}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  if (view === 'wrongAccount') {
    return (
      <Outcome
        tone='destructive'
        icon={<UserX size={20} />}
        title={
          invite?.invitedEmail
            ? t('wrongAccount.title', { email: invite.invitedEmail })
            : t('wrongAccount.titleNoEmail')
        }
        description={t('wrongAccount.description')}
        action={
          <Button variant='outline' onClick={() => logout(currentPath)}>
            {t('wrongAccount.cta')}
          </Button>
        }
      />
    );
  }

  if (view === 'expired') {
    return (
      <Outcome
        tone='destructive'
        icon={<Clock size={20} />}
        title={t('expired.title')}
        description={t('expired.description')}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  // Everything left is a link that resolves to nothing: a host removed the invitation, a resend
  // replaced the token, or co-host invitations are not switched on yet. The platform does not say
  // which, so the copy names the likely reasons and points at the host.
  return (
    <Outcome
      icon={<Link2Off size={20} />}
      title={t('invalid.title')}
      description={t('invalid.description')}
      onDismiss={() => setDismissed(true)}
    />
  );
}

function Shell({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'destructive';
}) {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col gap-5 rounded-2xl border-2 bg-mode-base/40 p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 dark:bg-white/10',
        tone === 'destructive'
          ? 'border-destructive/40'
          : 'border-white dark:border-none'
      )}
    >
      {children}
    </div>
  );
}

function Outcome({
  icon,
  title,
  description,
  action,
  onDismiss,
  tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Shows a small close control in the corner; the fundraiser below is the natural next thing to look at. */
  onDismiss?: () => void;
  /** `destructive` marks an outcome that closed the door, like an expired link. */
  tone?: 'default' | 'destructive';
}) {
  const t = useTranslations('HostInvite');

  return (
    <Shell tone={tone}>
      {onDismiss && (
        <button
          type='button'
          aria-label={t('close')}
          onClick={onDismiss}
          className='absolute top-2 right-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-mode-reverse/10 hover:text-foreground'
        >
          <X size={16} />
        </button>
      )}
      <div className='flex items-start gap-3 pr-8'>
        <span
          className={cn(
            'mt-0.5 shrink-0',
            tone === 'destructive' ? 'text-destructive' : 'text-foreground'
          )}
          aria-hidden='true'
        >
          {icon}
        </span>
        <div className='flex flex-col gap-1'>
          <p
            className={cn(
              'font-medium',
              tone === 'destructive' && 'text-destructive'
            )}
          >
            {title}
          </p>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </Shell>
  );
}
