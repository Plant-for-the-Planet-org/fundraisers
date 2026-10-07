import type { RawFundraiser } from './normalize-fundraiser';

import { describe, expect, it } from 'vitest';
import { normalizeFundraiser } from './normalize-fundraiser';

const raw = (overrides: Partial<RawFundraiser>): RawFundraiser =>
  ({
    goalAmount: 5000,
    totalRaised: { EUR: 3400 },
    donationCount: 12,
    workspace: null,
    ...overrides,
  }) as RawFundraiser;

describe('normalizeFundraiser', () => {
  it('keeps the figures the API sends', () => {
    const fundraiser = normalizeFundraiser(raw({}));

    expect(fundraiser.goalAmount).toBe(5000);
    expect(fundraiser.totalRaised).toEqual({ EUR: 3400 });
    expect(fundraiser.donationCount).toBe(12);
  });

  // The API sends null to the public for figures the host hid. A null totalRaised would crash every total.
  it('turns hidden figures into neutral values', () => {
    const fundraiser = normalizeFundraiser(
      raw({ goalAmount: null, totalRaised: null, donationCount: null })
    );

    expect(fundraiser.goalAmount).toBe(0);
    expect(fundraiser.totalRaised).toEqual({});
    expect(fundraiser.donationCount).toBe(0);
  });
});
