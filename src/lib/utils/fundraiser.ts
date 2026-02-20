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
  return `/raise/${identifier}`;
}
