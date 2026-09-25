import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { describe, expect, it } from 'vitest';
import { buildShareRenderData, pickShareDonors } from './share-data';

const donation = (
  donorName: string,
  isAnonymous = false
): LeaderboardDonation => ({
  id: donorName,
  amount: 10,
  currency: 'EUR',
  donorName,
  created: '2026-09-01T10:00:00',
  isAnonymous,
});

function fundraiser(
  leaderboard: Record<string, unknown> | undefined,
  overrides: Partial<Fundraiser> = {}
) {
  return {
    title: 'Forests for Our Future',
    goalAmount: 5000,
    totalRaised: { EUR: 3400 },
    currency: 'EUR',
    hosts: [
      {
        user: { id: 'u1', name: 'Maya Schneider', avatar: null },
        displayName: null,
        isPublic: true,
        role: 'owner',
        status: 'active',
        displayOrder: 0,
      },
    ],
    settings: { modules: { leaderboard } },
    ...overrides,
  } as unknown as Fundraiser;
}

const shownBoard = {
  enabled: true,
  show_recent_list: true,
  show_top_list: false,
  anonymize: false,
};

describe('pickShareDonors', () => {
  const board = {
    recent: [
      donation('Anna Weber'),
      donation('Hidden', true),
      donation('Ben'),
      donation('Anna K'),
      donation('Chloé Martin'),
    ],
    donorCount: 48,
  };

  it('names public donors by first name, once each', () => {
    expect(pickShareDonors(fundraiser(shownBoard), board)).toEqual({
      names: ['Anna', 'Ben', 'Chloé'],
      count: 48,
    });
  });

  it('names nobody when the leaderboard is off or anonymised', () => {
    expect(
      pickShareDonors(fundraiser({ ...shownBoard, enabled: false }), board)
    ).toBeNull();
    expect(
      pickShareDonors(fundraiser({ ...shownBoard, anonymize: true }), board)
    ).toBeNull();
    expect(pickShareDonors(fundraiser(undefined), board)).toBeNull();
  });

  it('leaves the row out with too few public donors', () => {
    expect(
      pickShareDonors(fundraiser(shownBoard), {
        recent: [donation('Anna'), donation('Ben')],
        donorCount: 2,
      })
    ).toBeNull();
  });
});

describe('buildShareRenderData', () => {
  const labels = {
    byLine: (host: string) => `by ${host}`,
    raisedOf: (raised: string, goal: string) => `${raised} raised of ${goal}`,
    raised: (raised: string) => `${raised} raised`,
    joined: (first: string, second: string, others: number) =>
      `${first}, ${second} and ${others} others have joined`,
  };

  it('fills the text from the fundraiser', () => {
    const data = buildShareRenderData({
      fundraiser: fundraiser(shownBoard),
      locale: 'en',
      donors: { names: ['Anna', 'Ben', 'Chloé'], count: 48 },
      cta: 'Join me',
      url: 'startplanting.org/raise/forests',
      labels,
    });
    expect(data.byLine).toBe('by Maya Schneider');
    expect(data.raised).toBe(3400);
    expect(data.goal).toBe(5000);
    expect(data.joinedLine).toBe('Anna, Ben and 46 others have joined');
    expect(
      data.raisedLine(data.formatMoney(3400), data.formatMoney(5000))
    ).toContain('raised of');
  });

  it('hides the goal when the host hides it', () => {
    const data = buildShareRenderData({
      fundraiser: fundraiser(shownBoard, {
        settings: {
          modules: {
            donor_score: {
              enabled: true,
              show_goal: false,
              show_days_left: true,
            },
          },
        },
      } as Partial<Fundraiser>),
      locale: 'en',
      donors: null,
      cta: 'Join me',
      url: 'x',
      labels,
    });
    expect(data.goal).toBeNull();
    expect(data.joinedLine).toBeNull();
    expect(data.raisedLine('€3,400', null)).toBe('€3,400 raised');
  });
});
