import type {
  Fundraiser,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';

import { cache } from 'react';
import { platformFetch } from './platform-fetch';

type RawFundraiser = Omit<Fundraiser, 'totalRaised'> & {
  totalRaised: number | Record<string, unknown> | null;
};

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeTotalRaised(
  totalRaised: RawFundraiser['totalRaised'],
  currency: string
): number {
  const direct = coerceNumber(totalRaised);
  if (direct !== null) {
    return direct;
  }

  if (!totalRaised || typeof totalRaised !== 'object') {
    return 0;
  }

  const byCurrency = totalRaised as Record<string, unknown>;
  const normalizedCurrency = currency.trim().toUpperCase();
  for (const [key, value] of Object.entries(byCurrency)) {
    if (key.trim().toUpperCase() === normalizedCurrency) {
      const amount = coerceNumber(value);
      if (amount !== null) {
        return amount;
      }
    }
  }

  return 0;
}

function normalizeFundraiser(fundraiser: RawFundraiser): Fundraiser {
  return {
    ...fundraiser,
    totalRaised: normalizeTotalRaised(fundraiser.totalRaised, fundraiser.currency),
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
