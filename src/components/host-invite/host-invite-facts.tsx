'use client';

import type { HostInvite } from '@/lib/types/host-invite';

import { useFormatter, useTranslations } from 'next-intl';
import { CalendarClock, Eye, EyeOff, Mail, User, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostInviteFactsProps {
  invite: Pick<HostInvite, 'role' | 'isPublic' | 'expiresAt' | 'invitedEmail'>;
  /** The dashboard already is the invited person's own account, so it leaves the address out. */
  showEmail?: boolean;
  className?: string;
}

/**
 * The short facts of an invitation, one icon line each, shared by the invitation bar on the fundraiser page and the dashboard card so the wording cannot drift apart.
 */
export function HostInviteFacts({
  invite,
  showEmail = false,
  className,
}: HostInviteFactsProps) {
  const t = useTranslations('HostInvite.pending');
  const format = useFormatter();
  // A deadline the platform sends in a form Date cannot read is left out rather than rendered as "Invalid Date".
  const deadline = invite.expiresAt ? new Date(invite.expiresAt) : null;
  const hasDeadline = deadline !== null && Number.isFinite(deadline.getTime());

  return (
    <ul
      className={cn(
        'grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2',
        className
      )}
    >
      {showEmail && invite.invitedEmail && (
        <li className='flex items-center gap-2'>
          <Mail size={16} className='shrink-0' />
          {t('invitedAs', { email: invite.invitedEmail })}
        </li>
      )}
      <li className='flex items-center gap-2'>
        {invite.role === 'viewer' ? (
          <User size={16} className='shrink-0' />
        ) : (
          <UserCog size={16} className='shrink-0' />
        )}
        {invite.role === 'viewer' ? t('roleViewer') : t('roleAdmin')}
      </li>
      <li className='flex items-center gap-2'>
        {invite.isPublic ? (
          <Eye size={16} className='shrink-0' />
        ) : (
          <EyeOff size={16} className='shrink-0' />
        )}
        {invite.isPublic ? t('publicYes') : t('publicNo')}
      </li>
      {hasDeadline && (
        <li className='flex items-center gap-2'>
          <CalendarClock size={16} className='shrink-0' />
          {t('expires', {
            date: format.dateTime(deadline, { dateStyle: 'medium' }),
          })}
        </li>
      )}
    </ul>
  );
}
