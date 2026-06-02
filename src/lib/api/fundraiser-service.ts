import type {
  Fundraiser,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';
import type { RawTotalRaised } from '@/lib/utils/number';

import { cache } from 'react';
import { normalizeTotalRaised } from '@/lib/utils/number';
import { platformFetch } from './platform-fetch';

type RawFundraiser = Omit<Fundraiser, 'totalRaised'> & {
  totalRaised: RawTotalRaised;
};

function normalizeFundraiser(fundraiser: RawFundraiser): Fundraiser {
  return {
    ...fundraiser,
    totalRaised: normalizeTotalRaised(
      fundraiser.totalRaised,
      fundraiser.currency
    ),
  };
}

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
  const fundraiser = await platformFetch<RawFundraiser>(
    fundraiserPath(slug, locale)
  );
  return normalizeFundraiser(fundraiser);
}

export async function getFundraiserAuthenticated(
  slug: string,
  token: string
): Promise<Fundraiser> {
  const fundraiser = await platformFetch<RawFundraiser>(
    `/fundraisers/${encodeURIComponent(slug)}`,
    { token }
  );
  return normalizeFundraiser(fundraiser);
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
  const fundraiser = await platformFetch<RawFundraiser>(`/fundraisers/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
  return normalizeFundraiser(fundraiser);
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
