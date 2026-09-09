import type {
  FundraiserHost,
  FundraiserHostStatus,
} from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import { selectPublicHosts } from './fundraiser-hosts';

function host(
  id: string,
  status: FundraiserHostStatus,
  isPublic: boolean
): FundraiserHost {
  return {
    id,
    user: null,
    hostType: 'user',
    role: 'admin',
    isPublic,
    displayName: id,
    displayOrder: null,
    status,
    invitedEmail: `${id}@example.org`,
  };
}

describe('selectPublicHosts', () => {
  it('shows the active hosts who chose to be public', () => {
    const hosts = [
      host('ada', 'active', true),
      host('bo', 'active', false),
      host('cy', 'active', true),
    ];

    expect(selectPublicHosts(hosts).map(h => h.id)).toEqual(['ada', 'cy']);
  });

  it('never shows a host who has not accepted, even when public', () => {
    const hosts = [
      host('ada', 'active', true),
      host('invited', 'invited', true),
      host('declined', 'declined', true),
      host('expired', 'expired', true),
    ];

    expect(selectPublicHosts(hosts).map(h => h.id)).toEqual(['ada']);
  });

  it('falls back to active hosts only when nobody picked public', () => {
    const hosts = [
      host('ada', 'active', false),
      host('bo', 'active', false),
      host('invited', 'invited', true),
      host('declined', 'declined', false),
    ];

    expect(selectPublicHosts(hosts).map(h => h.id)).toEqual(['ada', 'bo']);
  });

  it('returns nothing when no host is active', () => {
    const hosts = [
      host('invited', 'invited', true),
      host('declined', 'declined', true),
      host('expired', 'expired', false),
    ];

    expect(selectPublicHosts(hosts)).toEqual([]);
    expect(selectPublicHosts([])).toEqual([]);
  });
});
