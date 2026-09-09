import type * as PlatformFetchModule from './platform-fetch';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./platform-fetch', async importOriginal => {
  const actual = await importOriginal<typeof PlatformFetchModule>();
  return { ...actual, platformFetch: vi.fn() };
});

import type { PendingHostInvite } from '@/lib/types/host-invite';

import {
  declineHostInvite,
  getHostInvite,
  listMyHostInvites,
  respondToHostInvite,
} from './host-invite-service';
import { PlatformAPIError, platformFetch } from './platform-fetch';

const mockedPlatformFetch = platformFetch as ReturnType<typeof vi.fn>;

const TOKEN = 'access-token';

const invite = {
  id: 'frh_AbCdEfGhIjKl',
  state: 'pending',
  role: 'admin',
  isPublic: false,
  invitedEmail: 'r***@example.org',
  hasAccount: true,
  inviterName: 'Jamie Novak',
  expiresAt: '2026-09-16T10:00:00+00:00',
  answeredAt: null,
  fundraiser: { id: 'fr_1', title: 'Trees for Jane', slug: 'trees-for-jane' },
} as PendingHostInvite;

function httpError(status: number) {
  return new PlatformAPIError('http', status, null);
}

beforeEach(() => {
  mockedPlatformFetch.mockReset();
});

describe('getHostInvite', () => {
  it('returns the invitation when the token resolves', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(invite);

    await expect(getHostInvite('tok_abc')).resolves.toEqual({
      kind: 'found',
      invite,
    });
  });

  it('reports a 404 as not-found rather than throwing', async () => {
    // An unknown token, a token replaced by a resend, and a platform with co-host opt-in switched
    // off are all a 404 by design. The page shows the same screen for each.
    mockedPlatformFetch.mockRejectedValueOnce(httpError(404));

    await expect(getHostInvite('tok_abc')).resolves.toEqual({
      kind: 'not-found',
    });
  });

  it('keeps a real failure distinguishable from a missing invitation', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('network', 0, null)
    );

    await expect(getHostInvite('tok_abc')).resolves.toEqual({ kind: 'error' });
  });

  it('percent-encodes the token into the path', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(invite);

    await getHostInvite('tok/with?chars');

    expect(mockedPlatformFetch).toHaveBeenCalledWith(
      '/fundraiser-host-invites/tok%2Fwith%3Fchars'
    );
  });
});

describe('declineHostInvite', () => {
  it('posts to the decline route without a token header, whoever is signed in', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(invite);

    await declineHostInvite('tok_abc');

    expect(mockedPlatformFetch).toHaveBeenCalledWith(
      '/fundraiser-host-invites/tok_abc/decline',
      { method: 'POST' }
    );
  });

  it('reports an unauthorized answer so the page can send the visitor to sign in', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(httpError(401));

    await expect(declineHostInvite('tok_abc')).resolves.toEqual({
      kind: 'unauthorized',
    });
  });

  it('reports a forbidden answer when the session is not the invited account', async () => {
    // The platform sends 401 here as well; the body's error_code is what says "wrong account".
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 401, {
        error_type: 'unauthorized',
        error_code: 'no_access_to_resource',
      })
    );

    await expect(declineHostInvite('tok_abc')).resolves.toEqual({
      kind: 'forbidden',
    });
  });

  it('re-reads the invitation when the platform refuses with a conflict', async () => {
    // 409 means it was already answered or has lapsed. The message is not shown; the fresh state is
    // what the page needs, and in the reader's own language.
    mockedPlatformFetch
      .mockRejectedValueOnce(httpError(409))
      .mockResolvedValueOnce({ ...invite, state: 'accepted' });

    await expect(declineHostInvite('tok_abc')).resolves.toEqual({
      kind: 'conflict',
      invite: { ...invite, state: 'accepted' },
    });
  });

  it('survives the re-read itself failing', async () => {
    mockedPlatformFetch
      .mockRejectedValueOnce(httpError(409))
      .mockRejectedValueOnce(httpError(500));

    await expect(declineHostInvite('tok_abc')).resolves.toEqual({
      kind: 'conflict',
      invite: null,
    });
  });
});

describe('listMyHostInvites', () => {
  it('returns the pending invitations', async () => {
    mockedPlatformFetch.mockResolvedValueOnce({ items: [invite] });

    await expect(listMyHostInvites(TOKEN)).resolves.toEqual([invite]);
  });

  it('treats a 404 as nothing pending', async () => {
    // This is the common case for now: the platform's opt-in flag is off, and a dark route there is
    // indistinguishable from one that was never deployed. The dashboard must show nothing, not an
    // error, for however long that lasts.
    mockedPlatformFetch.mockRejectedValueOnce(httpError(404));

    await expect(listMyHostInvites(TOKEN)).resolves.toEqual([]);
  });

  it('returns null on a real failure, so it is not mistaken for an empty list', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(httpError(500));

    await expect(listMyHostInvites(TOKEN)).resolves.toBeNull();
  });

  it('tolerates a body with no items array', async () => {
    mockedPlatformFetch.mockResolvedValueOnce({});

    await expect(listMyHostInvites(TOKEN)).resolves.toEqual([]);
  });
});

describe('respondToHostInvite', () => {
  it('sends the answer with the caller session', async () => {
    mockedPlatformFetch.mockResolvedValueOnce(invite);

    await respondToHostInvite(invite.id, 'decline', TOKEN);

    expect(mockedPlatformFetch).toHaveBeenCalledWith(
      `/fundraiser-host-invites/${invite.id}/respond`,
      { method: 'POST', body: { answer: 'decline' }, token: TOKEN }
    );
  });

  it('reports a conflict without a re-read, because the row leaves the strip either way', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(httpError(409));

    await expect(
      respondToHostInvite(invite.id, 'accept', TOKEN)
    ).resolves.toEqual({ kind: 'conflict', invite: null });
    expect(mockedPlatformFetch).toHaveBeenCalledTimes(1);
  });
});
