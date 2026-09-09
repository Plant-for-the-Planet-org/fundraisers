import type { HostInvite, PendingHostInvite } from '@/lib/types/host-invite';

import { cache } from 'react';
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
  /** The platform wants a session for this answer. The visitor signs in and comes back to the same link. */
  | { kind: 'unauthorized' }
  /** The session belongs to someone other than the invited address. */
  | { kind: 'forbidden' }
  | { kind: 'error' };

/**
 * Pending invitations addressed to the signed-in person, for the dashboard.
 *
 * An empty list and a 404 are the same answer here, and the 404 is the common one for now: the platform's co-host opt-in is behind a flag, and a dark route there is indistinguishable from one that was never deployed. Neither is worth telling anybody about, so both come back as "nothing pending" and only a real failure is distinguishable.
 */
export async function listMyHostInvites(
  token: string
): Promise<PendingHostInvite[] | null> {
  try {
    const body = await platformFetch<{ items?: PendingHostInvite[] }>(
      '/fundraiser-host-invites',
      { token }
    );
    return body?.items ?? [];
  } catch (err) {
    if (isNotFound(err)) return [];

    // Null, not an empty array: the caller shows nothing either way, but a failure should not be
    // logged as "this person has no invitations".
    return null;
  }
}

/**
 * Answers an invitation from inside the app, where the session is the proof instead of a token.
 */
export async function respondToHostInvite(
  hostId: string,
  answer: 'accept' | 'decline',
  token: string
): Promise<HostInviteAnswer> {
  try {
    const invite = await platformFetch<PendingHostInvite>(
      `/fundraiser-host-invites/${encodeURIComponent(hostId)}/respond`,
      { method: 'POST', body: { answer }, token }
    );
    return { kind: 'answered', invite };
  } catch (err) {
    if (isNotFound(err)) return { kind: 'not-found' };

    // 409 means it was answered elsewhere, or its deadline passed while the dashboard was open.
    // The row is dropped from the strip either way, so there is nothing to re-read.
    if (err instanceof PlatformAPIError && err.status === 409) {
      return { kind: 'conflict', invite: null };
    }

    return { kind: 'error' };
  }
}

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

/** The layout reads the invitation to theme the page and the page reads it again to render it, so both go through this and the token is only looked up once per request. */
export const getCachedHostInvite = cache(getHostInvite);

export function acceptHostInvite(
  token: string,
  accessToken?: string
): Promise<HostInviteAnswer> {
  return answerHostInvite(token, 'accept', accessToken);
}

export function declineHostInvite(
  token: string,
  accessToken?: string
): Promise<HostInviteAnswer> {
  return answerHostInvite(token, 'decline', accessToken);
}

async function answerHostInvite(
  token: string,
  action: 'accept' | 'decline',
  accessToken?: string
): Promise<HostInviteAnswer> {
  try {
    // The token alone is enough to answer. A signed-in visitor sends their bearer token as well, so the platform can link the answer to their profile.
    const invite = await platformFetch<HostInvite>(invitePath(token, action), {
      method: 'POST',
      token: accessToken,
    });
    return { kind: 'answered', invite };
  } catch (err) {
    if (isNotFound(err)) {
      return { kind: 'not-found' };
    }

    // The platform answers 401 for both cases and tells them apart in the body: `authentication_required` for a missing session, `no_access_to_resource` when the session is not the invited account.
    if (
      (err instanceof PlatformAPIError && err.status === 403) ||
      platformErrorCode(err) === 'no_access_to_resource'
    ) {
      return { kind: 'forbidden' };
    }

    if (err instanceof PlatformAPIError && err.status === 401) {
      return { kind: 'unauthorized' };
    }

    // 409 means the invitation was already answered, or its deadline passed. The message the platform sends is not shown: re-reading the invitation gives the state the page needs to render, in the reader's own language.
    if (err instanceof PlatformAPIError && err.status === 409) {
      return { kind: 'conflict', invite: await fetchInviteOrNull(token) };
    }

    return { kind: 'error' };
  }
}

function platformErrorCode(err: unknown): string | null {
  if (!(err instanceof PlatformAPIError)) return null;
  const body = err.body as { error_code?: unknown } | null;
  return typeof body?.error_code === 'string' ? body.error_code : null;
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
