import { describe, expect, it } from 'vitest';
import { hasFundraiserConcluded } from './fundraiser';

const past = new Date(Date.now() - 86_400_000).toISOString();
const future = new Date(Date.now() + 30 * 86_400_000).toISOString();

describe('hasFundraiserConcluded', () => {
  it('is true for completed and archived fundraisers', () => {
    expect(
      hasFundraiserConcluded({
        status: 'completed',
        canDonate: false,
        endDate: future,
      })
    ).toBe(true);
    expect(
      hasFundraiserConcluded({
        status: 'archived',
        canDonate: false,
        endDate: past,
      })
    ).toBe(true);
  });

  it('is false for cancelled, paused and draft, so none of them reads as a win', () => {
    for (const status of ['cancelled', 'paused', 'draft'] as const) {
      expect(
        hasFundraiserConcluded({ status, canDonate: false, endDate: future })
      ).toBe(false);
    }
  });

  it('is true for an active fundraiser past its end date', () => {
    expect(
      hasFundraiserConcluded({
        status: 'active',
        canDonate: false,
        endDate: past,
      })
    ).toBe(true);
  });

  it('is false for an active fundraiser inside its window', () => {
    // Payment options failed to load or the workspace is missing. The fundraiser has not ended.
    expect(
      hasFundraiserConcluded({
        status: 'active',
        canDonate: false,
        endDate: future,
      })
    ).toBe(false);
  });
});
