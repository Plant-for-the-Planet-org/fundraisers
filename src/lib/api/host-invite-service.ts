import type { HostInvite } from '@/lib/types/host-invite';

import { PlatformAPIError, platformFetch } from './platform-fetch';

/**
 * Answering a co-host invitation.
 *
 * Reading is separate from answering because mail clients and corporate gateways fetch every link in an incoming message before a human sees it. The accept link therefore opens a page, that page reads the invitation with `getHostInvite`, and a real click calls `acceptHostInvite`.
 *
 * These endpoints are public: the token is the proof, and no access token is sent.
 *
 * A 404 is not exceptional here. It is what an unknown token, a token replaced by a resend, and a platform that has not enabled co-host opt-in yet all look like, and the three are indistinguishable by design. So results are returned as values rather than thrown, and the page renders its "not a valid invitation" state for all of them.
 */

export type HostInviteLookup =
  | { kind: 'found'; invite: HostInvite }
  | { kind: 'not-found' }
  | { kind: 'error' };

export type HostInviteAnswer =
  | { kind: 'answered'; invite: HostInvite }
  /** The platform refused because the invitation had already moved on. Carries the authoritative state where it could be re-read. */
  | { kind: 'conflict'; invite: HostInvite | null }
  | { kind: 'not-found' }
  | { kind: 'error' };

function invitePath(token: string, action?: 'accept' | 'decline'): string {
  const base = `/fundraiser-host-invites/${encodeURIComponent(token)}`;
  return action ? `${base}/${action}` : base;
}

export async function getHostInvite(token: string): Promise<HostInviteLookup> {
  try {
    return { kind: 'found', invite: await fetchInvite(token) };
  } catch (err) {
    return isNotFound(err) ? { kind: 'not-found' } : { kind: 'error' };
  }
}

export function acceptHostInvite(token: string): Promise<HostInviteAnswer> {
  return answerHostInvite(token, 'accept');
}

export function declineHostInvite(token: string): Promise<HostInviteAnswer> {
  return answerHostInvite(token, 'decline');
}

async function answerHostInvite(
  token: string,
  action: 'accept' | 'decline'
): Promise<HostInviteAnswer> {
  try {
    const invite = await platformFetch<HostInvite>(invitePath(token, action), {
      method: 'POST',
    });
    return { kind: 'answered', invite };
  } catch (err) {
    if (isNotFound(err)) {
      return { kind: 'not-found' };
    }

    // 409 means the invitation was already answered, or its deadline passed. The message the platform sends is not shown: re-reading the invitation gives the state the page needs to render, in the reader's own language.
    if (err instanceof PlatformAPIError && err.status === 409) {
      return { kind: 'conflict', invite: await fetchInviteOrNull(token) };
    }

    return { kind: 'error' };
  }
}

function fetchInvite(token: string): Promise<HostInvite> {
  return platformFetch<HostInvite>(invitePath(token));
}

async function fetchInviteOrNull(token: string): Promise<HostInvite | null> {
  try {
    return await fetchInvite(token);
  } catch {
    return null;
  }
}

function isNotFound(err: unknown): boolean {
  return err instanceof PlatformAPIError && err.status === 404;
}
