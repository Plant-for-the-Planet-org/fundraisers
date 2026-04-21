import type { Fundraiser } from '@/lib/types/fundraiser';

export function isActiveFundraiser(
  fundraiser: Fundraiser,
  now: Date = new Date()
): boolean {
  if (!fundraiser.canDonate) {
    return false;
  }
  const today = now.toISOString().slice(0, 10);
  return fundraiser.endDate >= today;
}
