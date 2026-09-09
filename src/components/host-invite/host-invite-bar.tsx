'use client';

import type { HostInviteLookup } from '@/lib/api/host-invite-service';
import type { HostInvite } from '@/lib/types/host-invite';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Info,
  Link2Off,
  Loader2,
  Mail,
  User,
  UserCog,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  acceptHostInvite,
  declineHostInvite,
} from '@/lib/api/host-invite-service';
import { cn } from '@/lib/utils';
import { isHostInviteLapsed } from '@/lib/utils/host-invite';
import { useAuthStore } from '@/stores/auth-store';
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
  /** Where the fundraiser this invitation is about actually lives, once known. */
}

/**
 * A full-width bar for answering a co-host invitation, shown above the fundraiser it invites to.
 * The fundraiser's own cover and title already sit right below it, so this only carries what the
 * invitation itself adds: who is asking, what the role means, and the deadline.
 */
export function HostInviteBar({ token, lookup, intent }: HostInviteBarProps) {
  const t = useTranslations('HostInvite');
  const format = useFormatter();
  // A declined, expired or invalid invitation has nothing left to do here; the fundraiser is right below, so the bar just goes away.
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

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

  if (dismissed) return null;

  if (view === 'pending' && invite) {
    return (
      <Shell>
        <div className='flex flex-col gap-2.5'>
          <p
            className='text-sm font-medium'
            style={{ color: 'var(--accent-color)' }}
          >
            {invite.inviterName
              ? t('pending.eyebrowWithInviter', { inviter: invite.inviterName })
              : t('pending.eyebrow')}
          </p>
          <ul className='grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2'>
            {invite.invitedEmail && (
              <li className='flex items-center gap-2'>
                <Mail size={16} className='shrink-0' />
                {t('pending.invitedAs', { email: invite.invitedEmail })}
              </li>
            )}
            {invite.expiresAt && (
              <li className='flex items-center gap-2'>
                <CalendarClock size={16} className='shrink-0' />
                {t('pending.expires', {
                  date: format.dateTime(new Date(invite.expiresAt), {
                    dateStyle: 'medium',
                  }),
                })}
              </li>
            )}
            <li className='flex items-center gap-2'>
              {invite.isPublic ? (
                <Eye size={16} className='shrink-0' />
              ) : (
                <EyeOff size={16} className='shrink-0' />
              )}
              {invite.isPublic ? t('pending.publicYes') : t('pending.publicNo')}
            </li>
            <li className='flex items-center gap-2'>
              {invite.role === 'viewer' ? (
                <User size={16} className='shrink-0' />
              ) : (
                <UserCog size={16} className='shrink-0' />
              )}
              {invite.role === 'viewer'
                ? t('pending.roleViewer')
                : t('pending.roleAdmin')}
            </li>
          </ul>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2 lg:w-52 lg:flex-col'>
          <Button
            className='min-w-40 text-white hover:opacity-90 lg:w-full'
            // Same as the video consent button: the fundraiser's accent, falling back to the primary colour outside a theme.
            style={{
              backgroundColor: 'var(--accent-color, hsl(var(--primary)))',
            }}
            disabled={isAnswering}
            onClick={() => void answer('accept')}
          >
            {isAnswering && <Loader2 className='animate-spin' size={16} />}
            {isAnswering ? t('pending.answering') : t('pending.accept')}
          </Button>
          <Button
            ref={declineRef}
            variant='outline'
            className='min-w-40 lg:w-full'
            disabled={isAnswering}
            onClick={() => void answer('decline')}
          >
            {t('pending.decline')}
          </Button>
        </div>
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
          <Button asChild>
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

  // Everything left is a link that resolves to nothing: an unknown token, one replaced by a
  // resend, or a platform where co-host invitations are not switched on yet. A reader cannot act
  // on the difference, so all three read the same.
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
