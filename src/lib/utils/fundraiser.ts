/**
 * Utility functions for fundraisers
 */

import type { Fundraiser } from '../types/fundraiser';
import type { Nullable } from '../types/utility';

export interface FundraiserUrlData {
  id: string;
  slug?: Nullable<string>;
}

/**
 * True when `userId` matches a host on `fundraiser` whose role is `owner`.
 * Returns false when `userId` is missing.
 */
export function isFundraiserOwnerOrAdmin(
  fundraiser: Fundraiser,
  userId: string | null | undefined
): boolean {
  if (!userId) return false;
  return fundraiser.hosts.some(
    host =>
      host.user?.id === userId &&
      (host.role === 'owner' || host.role === 'admin')
  );
}

/**
 * Generate a fundraiser URL using the new /raise/[id|slug] pattern
 * Prioritizes slug over ID when available
 *
 * @param fundraiser - Object containing id and optional slug
 * @returns URL path for the fundraiser
 */
export function getFundraiserUrl(fundraiser: FundraiserUrlData): string {
  const identifier = fundraiser.slug || fundraiser.id;
  return `/raise/${encodeURIComponent(identifier)}`;
}

export interface SingleCurrencyTotalRaised {
  currency: string;
  amount: number;
}

/**
 * Returns raised amounts as a sorted array (highest first), filtering out zero or non-finite values. Currency keys are normalized to uppercase.
 */
export function getTotalRaisedByCurrency(
  totalRaised: Record<string, number>
): SingleCurrencyTotalRaised[] {
  return Object.entries(totalRaised)
    .filter(([_currency, amount]) => Number.isFinite(amount) && amount > 0)
    .map(([currency, amount]) => ({ currency: currency.toUpperCase(), amount }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Days remaining until `endDate`, rounded up, never negative.
 */
export function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 0;
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}
