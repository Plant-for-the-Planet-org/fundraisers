import type { Fundraiser } from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import {
  deriveDisplayStatus,
  filterFundraisers,
  getStatusCounts,
} from './fundraiser-list';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function makeFundraiser(overrides: Partial<Fundraiser> = {}): Fundraiser {
  return {
    id: 'fr_1',
    hid: 'HID',
    slug: 'trees',
    title: 'Trees',
    description: null,
    image: null,
    goalAmount: 1000,
    totalRaised: {},
    donationCount: 0,
    currency: 'EUR',
    workspace: null,
    hosts: [],
    visibility: 'public',
    status: 'active',
    canDonate: true,
    projectAllocations: [],
    startDate: daysFromNow(-30),
    endDate: daysFromNow(30),
    content: null,
    metadata: null,
    settings: null,
    ...overrides,
  } as Fundraiser;
}

// The platform can leave a fundraiser `active` after its end date, with donations closed.
const pastEndDate = makeFundraiser({
  id: 'fr_past',
  endDate: daysFromNow(-400),
  canDonate: false,
});

describe('fundraiser status on the dashboard', () => {
  it('shows an active fundraiser past its end date as ended', () => {
    expect(deriveDisplayStatus(pastEndDate)).toBe('ended');
  });

  it('keeps a live fundraiser active', () => {
    expect(deriveDisplayStatus(makeFundraiser())).toBe('active');
  });

  it('keeps a live fundraiser active when donations are off for another reason', () => {
    expect(deriveDisplayStatus(makeFundraiser({ canDonate: false }))).toBe(
      'active'
    );
  });

  it('counts and filters it under ended, not active', () => {
    const list = [makeFundraiser(), pastEndDate];
    expect(getStatusCounts(list)).toMatchObject({ active: 1, ended: 1 });
    expect(
      filterFundraisers(list, { search: '', status: 'ended' }).map(f => f.id)
    ).toEqual(['fr_past']);
  });
});
