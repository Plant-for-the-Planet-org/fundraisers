import type { HostInviteLookup } from '@/lib/api/host-invite-service';
import type { Fundraiser } from '@/lib/types/fundraiser';
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

/**
 * The slug the invite page should redirect to when a found invitation names a fundraiser at a
 * different slug than the one in the URL, because a host renamed it after the invite went out.
 * Null when there is nothing to redirect for: the invitation did not load, or already agrees.
 */
export function getHostInviteRedirectSlug(
  lookup: HostInviteLookup,
  currentSlug: string
): string | null {
  if (lookup.kind !== 'found') return null;

  const slug = lookup.invite.fundraiser.slug;
  return slug && slug !== currentSlug ? slug : null;
}

/**
 * Whether a found invitation is actually for the given fundraiser. This should always hold once
 * `getHostInviteRedirectSlug` has sent the visitor to the right slug — it exists to render the
 * invite bar's invalid state instead of trusting that redirect blindly.
 */
export function hostInviteMatchesFundraiser(
  invite: HostInvite,
  fundraiser: Pick<Fundraiser, 'id' | 'slug'>
): boolean {
  const { id, slug } = invite.fundraiser;
  if (id && id !== fundraiser.id) return false;
  if (slug && slug !== fundraiser.slug) return false;
  return true;
}

/**
 * The lookup the invite bar should actually render: a found invitation for the wrong fundraiser
 * reads the same as one that was never found, since there is nothing correct to answer here.
 */
export function resolveHostInviteBarLookup(
  lookup: HostInviteLookup,
  fundraiser: Pick<Fundraiser, 'id' | 'slug'>
): HostInviteLookup {
  if (
    lookup.kind === 'found' &&
    !hostInviteMatchesFundraiser(lookup.invite, fundraiser)
  ) {
    return { kind: 'not-found' };
  }

  return lookup;
}

/**
 * Whether a masked invitation address (`m***@example.org`, as the platform serves it) can belong to a full address.
 *
 * The mask keeps the first character and the domain, so those are compared, case-insensitively. A match is not proof; the platform makes the real check. A mismatch is proof enough to tell the visitor the invitation is for someone else without a round trip.
 */
export function maskedEmailMayMatch(masked: string, email: string): boolean {
  const [maskedLocal = '', maskedDomain = ''] = masked.toLowerCase().split('@');
  const [local = '', domain = ''] = email.toLowerCase().split('@');
  if (!maskedDomain || !domain || maskedDomain !== domain) return false;

  const visible = maskedLocal.replace(/\*+$/, '');
  return local.startsWith(visible);
}
