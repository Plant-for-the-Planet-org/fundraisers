import type {
  Fundraiser,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';

import { cache } from 'react';
import { platformFetch } from './platform-fetch';

function fundraiserPath(slug: string, locale?: string): string {
  const path = `/fundraisers/${encodeURIComponent(slug)}`;
  if (!locale) {
    return path;
  }
  const params = new URLSearchParams({ locale });
  return `${path}?${params.toString()}`;
}

export async function getFundraiser(
  slug: string,
  locale?: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>(fundraiserPath(slug, locale));
}

export async function getFundraiserAuthenticated(
  slug: string,
  token: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>(`/fundraisers/${encodeURIComponent(slug)}`, {
    token,
  });
}

export const getCachedFundraiser = cache(
  async (slug: string, locale: string) => {
    return getFundraiser(slug, locale);
  }
);

export async function updateFundraiser(
  id: string,
  data: UpdateFundraiserRequest,
  token: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>(`/fundraisers/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export function pauseFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return updateFundraiser(id, { status: 'paused' }, token);
}

export function resumeFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return updateFundraiser(id, { status: 'active' }, token);
}
