import { describe, expect, it } from 'vitest';
import { mergeReferrals } from './referrals';

describe('mergeReferrals', () => {
  it('joins visits and donations per code, codes that brought donations first', () => {
    expect(
      mergeReferrals({ anna1: 40, ben22: 12, cleo3: 3 }, { ben22: 2, dora4: 1 })
    ).toEqual([
      { ref: 'ben22', visits: 12, donations: 2 },
      { ref: 'dora4', visits: 0, donations: 1 },
      { ref: 'anna1', visits: 40, donations: 0 },
      { ref: 'cleo3', visits: 3, donations: 0 },
    ]);
  });

  it('keeps the top six', () => {
    const visits = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [`code${i}`, i])
    );
    expect(mergeReferrals(visits, {})).toHaveLength(6);
  });
});
