/**
 * Utility functions for fundraisers
 */

import type { Nullable } from '../types/utility';

export interface FundraiserUrlData {
  id: string;
  slug?: Nullable<string>;
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
  return `/fundraisers/${identifier}`;
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
