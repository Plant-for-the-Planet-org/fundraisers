import type { HostInvite } from '@/lib/types/host-invite';

import { describe, expect, it } from 'vitest';
import {
  HOST_INVITE_NOTICES,
  isHostInviteLapsed,
  isHostInviteNoticeProminent,
  parseHostInviteNotice,
} from './host-invite';

const invite = (
  state: HostInvite['state'],
  expiresAt: string | null
): Pick<HostInvite, 'state' | 'expiresAt'> => ({ state, expiresAt });

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
