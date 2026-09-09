import { describe, expect, it } from 'vitest';
import {
  HOST_INVITE_NOTICES,
  isHostInviteNoticeProminent,
  parseHostInviteNotice,
} from './host-invite';

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
