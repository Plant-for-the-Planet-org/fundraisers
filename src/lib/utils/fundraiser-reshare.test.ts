import type { ShareDonorProgress } from '@/lib/share/share-data';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import {
  getRaisedPercent,
  getReshareMoment,
  MILESTONE_WINDOW,
} from './fundraiser-reshare';

const fundraiser = (
  raised: number,
  overrides: Partial<Fundraiser> = {}
): Fundraiser =>
  ({
    status: 'active',
    canDonate: true,
    goalAmount: 1000,
    currency: 'EUR',
    totalRaised: { EUR: raised },
    endDate: '2099-12-31',
    settings: { modules: { donor_score: { enabled: true, show_goal: true } } },
    ...overrides,
  }) as unknown as Fundraiser;

const donors = (
  status: ShareDonorProgress['status'],
  total: number
): ShareDonorProgress => ({ status, count: 3, total });

describe('getRaisedPercent', () => {
  it('is the share of the goal, not rounded', () => {
    expect(getRaisedPercent(fundraiser(255))).toBeCloseTo(25.5);
  });

  it('is null without a goal', () => {
    expect(getRaisedPercent(fundraiser(255, { goalAmount: 0 }))).toBeNull();
  });
});

describe('getReshareMoment', () => {
  it('names a milestone while it is fresh, and the highest one passed', () => {
    expect(getReshareMoment(fundraiser(260), null)).toEqual({
      kind: 'progress',
      percent: 25,
    });
    expect(getReshareMoment(fundraiser(500), null)).toEqual({
      kind: 'progress',
      percent: 50,
    });
    expect(getReshareMoment(fundraiser(760), null)).toEqual({
      kind: 'progress',
      percent: 75,
    });
    // Between two windows there is no news.
    expect(getReshareMoment(fundraiser(690), null)).toBeNull();
  });

  it('lets a milestone go once the fundraiser has moved on', () => {
    expect(
      getReshareMoment(fundraiser(250 + MILESTONE_WINDOW * 10), null)
    ).toBeNull();
    expect(getReshareMoment(fundraiser(100), null)).toBeNull();
  });

  it('says so when the goal is reached, for a while after', () => {
    expect(getReshareMoment(fundraiser(1000), null)).toEqual({ kind: 'goal' });
    expect(getReshareMoment(fundraiser(1150), null)).toEqual({ kind: 'goal' });
    expect(getReshareMoment(fundraiser(1300), null)).toBeNull();
  });

  it('falls back to the first donors who can be named, while they are new', () => {
    expect(getReshareMoment(fundraiser(100), donors('ready', 3))).toEqual({
      kind: 'donors',
      count: 3,
    });
    expect(getReshareMoment(fundraiser(100), donors('ready', 12))).toBeNull();
    expect(getReshareMoment(fundraiser(100), donors('few', 2))).toBeNull();
  });

  it('puts the goal, then a milestone, before the donors', () => {
    expect(getReshareMoment(fundraiser(1000), donors('ready', 3))?.kind).toBe(
      'goal'
    );
    expect(getReshareMoment(fundraiser(520), donors('ready', 3))?.kind).toBe(
      'progress'
    );
  });

  it('has no progress news when the goal is hidden', () => {
    const hidden = fundraiser(520, {
      settings: {
        modules: { donor_score: { enabled: true, show_goal: false } },
      },
    } as unknown as Partial<Fundraiser>);
    expect(getReshareMoment(hidden, null)).toBeNull();
  });

  it('has nothing for a fundraiser that cannot take gifts, or has ended', () => {
    expect(
      getReshareMoment(fundraiser(520, { canDonate: false }), null)
    ).toBeNull();
    expect(
      getReshareMoment(fundraiser(520, { status: 'completed' }), null)
    ).toBeNull();
  });
});
