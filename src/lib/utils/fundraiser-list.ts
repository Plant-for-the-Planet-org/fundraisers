import type { Fundraiser } from '@/lib/types/fundraiser';

import { getDaysLeft } from './fundraiser';

export type DisplayStatus = 'active' | 'paused' | 'ended' | 'ending-soon';

export const ENDING_SOON_THRESHOLD_DAYS = 7;

// Used by `FundraiserStatusBadge` (added in PR 3) to pick the badge variant.
export function deriveDisplayStatus(fundraiser: Fundraiser): DisplayStatus {
  switch (fundraiser.status) {
    case 'completed':
    case 'cancelled':
      return 'ended';
    case 'paused':
    case 'draft':
      return 'paused';
    case 'active': {
      const daysLeft = getDaysLeft(fundraiser.endDate);
      if (daysLeft > 0 && daysLeft <= ENDING_SOON_THRESHOLD_DAYS) {
        return 'ending-soon';
      }
      return 'active';
    }
    default:
      return 'active';
  }
}
