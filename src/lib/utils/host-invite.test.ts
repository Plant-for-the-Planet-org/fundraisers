import type { HostInviteLookup } from '@/lib/api/host-invite-service';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { HostInvite } from '@/lib/types/host-invite';

import { describe, expect, it } from 'vitest';
import {
  getHostInviteRedirectSlug,
  HOST_INVITE_NOTICES,
  hostInviteMatchesFundraiser,
  isHostInviteLapsed,
  isHostInviteNoticeProminent,
  parseHostInviteNotice,
  resolveHostInviteBarLookup,
} from './host-invite';

const invite = (
  state: HostInvite['state'],
  expiresAt: string | null
): Pick<HostInvite, 'state' | 'expiresAt'> => ({ state, expiresAt });

const foundInvite = (
  fundraiser: HostInvite['fundraiser']
): Extract<HostInviteLookup, { kind: 'found' }> => ({
  kind: 'found',
  invite: {
    state: 'pending',
    role: 'admin',
    isPublic: false,
    invitedEmail: null,
    hasAccount: true,
    inviterName: null,
    expiresAt: null,
    answeredAt: null,
    fundraiser,
  },
});

const fundraiser = (
  id: string,
  slug: string
): Pick<Fundraiser, 'id' | 'slug'> => ({ id, slug });

describe('parseHostInviteNotice', () => {
  it('accepts every notice the accept page can redirect with', () => {
    for (const notice of HOST_INVITE_NOTICES) {
      expect(parseHostInviteNotice(notice)).toBe(notice);
    }
  });

  it('ignores anything it does not recognise', () => {
    expect(parseHostInviteNotice(null)).toBeNull();
    expect(parseHostInviteNotice(undefined)).toBeNull();
    expect(parseHostInviteNotice('')).toBeNull();
    expect(parseHostInviteNotice('ACCEPTED')).toBeNull();
    expect(parseHostInviteNotice('accepted ')).toBeNull();
  });

  it('never lets the URL supply its own text', () => {
    // The parameter picks a translated message; it must not be able to carry one.
    expect(parseHostInviteNotice('<b>You are an admin now</b>')).toBeNull();
    expect(parseHostInviteNotice('You are now a host of anything')).toBeNull();
  });
});

describe('isHostInviteNoticeProminent', () => {
  it('interrupts only for an acceptance', () => {
    expect(isHostInviteNoticeProminent('accepted')).toBe(true);
    expect(isHostInviteNoticeProminent('declined')).toBe(false);
    expect(isHostInviteNoticeProminent('expired')).toBe(false);
    expect(isHostInviteNoticeProminent('invalid')).toBe(false);
    expect(isHostInviteNoticeProminent('already-host')).toBe(false);
  });
});

describe('isHostInviteLapsed', () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();

  it('treats a pending invitation past its deadline as lapsed', () => {
    expect(isHostInviteLapsed(invite('pending', past))).toBe(true);
  });

  it('leaves a pending invitation with time left alone', () => {
    expect(isHostInviteLapsed(invite('pending', future))).toBe(false);
    expect(isHostInviteLapsed(invite('pending', null))).toBe(false);
    expect(isHostInviteLapsed(invite('pending', 'not a date'))).toBe(false);
  });

  it('says nothing about an invitation that was already answered', () => {
    expect(isHostInviteLapsed(invite('accepted', past))).toBe(false);
    expect(isHostInviteLapsed(invite('declined', past))).toBe(false);
    expect(isHostInviteLapsed(invite('expired', past))).toBe(false);
  });
});

describe('getHostInviteRedirectSlug', () => {
  it('redirects when the invitation names a different slug', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: 'new-slug' });
    expect(getHostInviteRedirectSlug(lookup, 'old-slug')).toBe('new-slug');
  });

  it('does not redirect when the slug already matches', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: 'trees' });
    expect(getHostInviteRedirectSlug(lookup, 'trees')).toBeNull();
  });

  it('does not redirect when the invitation has no slug to redirect to', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: null });
    expect(getHostInviteRedirectSlug(lookup, 'old-slug')).toBeNull();
  });

  it('does not redirect for a not-found or errored lookup', () => {
    expect(
      getHostInviteRedirectSlug({ kind: 'not-found' }, 'trees')
    ).toBeNull();
    expect(getHostInviteRedirectSlug({ kind: 'error' }, 'trees')).toBeNull();
  });
});

describe('hostInviteMatchesFundraiser', () => {
  it('matches when both id and slug agree', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: 'trees' });
    expect(
      hostInviteMatchesFundraiser(lookup.invite, fundraiser('fr_1', 'trees'))
    ).toBe(true);
  });

  it('does not match a different fundraiser id', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: 'trees' });
    expect(
      hostInviteMatchesFundraiser(lookup.invite, fundraiser('fr_2', 'trees'))
    ).toBe(false);
  });

  it('does not match a different fundraiser slug', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: 'trees' });
    expect(
      hostInviteMatchesFundraiser(lookup.invite, fundraiser('fr_1', 'other'))
    ).toBe(false);
  });

  it('matches when the invitation is missing an id or slug to compare', () => {
    const lookup = foundInvite({ id: null, title: 'x', slug: null });
    expect(
      hostInviteMatchesFundraiser(lookup.invite, fundraiser('fr_1', 'trees'))
    ).toBe(true);
  });
});

describe('resolveHostInviteBarLookup', () => {
  it('passes a matching invitation through unchanged', () => {
    const lookup = foundInvite({ id: 'fr_1', title: 'x', slug: 'trees' });
    expect(
      resolveHostInviteBarLookup(lookup, fundraiser('fr_1', 'trees'))
    ).toBe(lookup);
  });

  it('treats an invitation for a different fundraiser as not found', () => {
    const lookup = foundInvite({ id: 'fr_2', title: 'x', slug: 'other' });
    expect(
      resolveHostInviteBarLookup(lookup, fundraiser('fr_1', 'trees'))
    ).toEqual({ kind: 'not-found' });
  });

  it('passes a not-found or errored lookup through unchanged', () => {
    expect(
      resolveHostInviteBarLookup({ kind: 'not-found' }, fundraiser('fr_1', 't'))
    ).toEqual({ kind: 'not-found' });
    expect(
      resolveHostInviteBarLookup({ kind: 'error' }, fundraiser('fr_1', 't'))
    ).toEqual({ kind: 'error' });
  });
});
