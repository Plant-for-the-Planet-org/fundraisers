import type { Fundraiser, FundraiserStatus } from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import { getAvailableActions } from './fundraiser-actions';

const OWNER = 'user-owner';

const fundraiser = (
  status: FundraiserStatus,
  role: 'owner' | 'admin' | 'viewer' = 'owner'
) =>
  ({
    status,
    hosts: [{ user: { id: OWNER }, role }],
    settings: {},
  }) as unknown as Fundraiser;

describe('getAvailableActions: go live', () => {
  it('is offered for a draft to its owner and its admins', () => {
    expect(getAvailableActions(fundraiser('draft'), OWNER).publish).toBe(true);
    expect(
      getAvailableActions(fundraiser('draft', 'admin'), OWNER).publish
    ).toBe(true);
  });

  it.each(['active', 'paused', 'completed', 'cancelled', 'archived'] as const)(
    'is not offered for a %s fundraiser',
    status => {
      expect(getAvailableActions(fundraiser(status), OWNER).publish).toBe(
        false
      );
    }
  );

  it('is not offered to a viewer, or to someone who is not a host', () => {
    expect(
      getAvailableActions(fundraiser('draft', 'viewer'), OWNER).publish
    ).toBe(false);
    expect(
      getAvailableActions(fundraiser('draft'), 'someone-else').publish
    ).toBe(false);
    expect(getAvailableActions(fundraiser('draft'), null).publish).toBe(false);
  });

  it('keeps the other actions of a draft as they were', () => {
    const actions = getAvailableActions(fundraiser('draft'), OWNER);
    expect(actions).toMatchObject({
      edit: true,
      clone: true,
      copyLink: true,
      pause: false,
      resume: false,
      delete: true,
    });
  });
});
