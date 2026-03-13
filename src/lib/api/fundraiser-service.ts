import { cache } from 'react';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { platformAPIClient } from './external-client';

export async function getFundraiser(slug: string): Promise<Fundraiser> {
  return platformAPIClient.get<Fundraiser>(`/fundraisers/${slug}`);
}

export async function getFundraiserAuthenticated(
  slug: string,
  token: string
): Promise<Fundraiser> {
  return platformAPIClient.getAuthenticated<Fundraiser>(
    `/fundraisers/${slug}`,
    token
  );
}

export const getCachedFundraiser = cache(async (slug: string) => {
  return getFundraiser(slug);
});
