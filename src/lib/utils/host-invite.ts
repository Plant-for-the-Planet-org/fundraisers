import type { HostInvite } from '@/lib/types/host-invite';

/**
 * The confirmation the fundraiser page shows after someone answers a co-host invitation.
 *
 * The accept page redirects to `/raise/<slug>?hostInvite=<outcome>`, and this turns that one parameter into a message. The set is closed and the parameter selects a message rather than carrying one: nothing from the URL is ever rendered, so a hand-edited link cannot put words on our page.
 */
export const HOST_INVITE_NOTICES = [
  'accepted',
  'declined',
  'expired',
  'invalid',
  'already-host',
] as const;

export type HostInviteNotice = (typeof HOST_INVITE_NOTICES)[number];

export const HOST_INVITE_NOTICE_PARAM = 'hostInvite';

/** Anything unrecognised is ignored, so an old or mangled link shows the page and no message. */
export function parseHostInviteNotice(
  value: string | null | undefined
): HostInviteNotice | null {
  return HOST_INVITE_NOTICES.includes(value as HostInviteNotice)
    ? (value as HostInviteNotice)
    : null;
}

/** Accepting is the one outcome worth interrupting for; the rest are told in passing. */
export function isHostInviteNoticeProminent(notice: HostInviteNotice): boolean {
  return notice === 'accepted';
}

/**
 * Whether a pending invitation has already run out of time.
 *
 * The platform writes the `expired` state in a daily sweep, so between the deadline and the sweep an invitation still reads as `pending` while answering it returns 409. Callers use this to show the expired outcome instead of actions that cannot work.
 */
export function isHostInviteLapsed(
  invite: Pick<HostInvite, 'state' | 'expiresAt'>
): boolean {
  if (invite.state !== 'pending' || !invite.expiresAt) return false;

  const deadline = new Date(invite.expiresAt).getTime();
  return Number.isFinite(deadline) && deadline <= Date.now();
}
