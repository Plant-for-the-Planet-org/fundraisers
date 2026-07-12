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

/**
 * Extends a fundraiser by setting a new end date only.
 *
 * A partial PUT: status, donations, and every other field are left untouched
 * (same pattern as `pauseFundraiser`/`resumeFundraiser`). `endDate` is a
 * date-only value (YYYY-MM-DD).
 */
export function extendFundraiser(
  id: string,
  endDate: string,
  token: string
): Promise<Fundraiser> {
  return updateFundraiser(id, { endDate }, token);
}

/**
 * Deletes a fundraiser.
 *
 * Success can return either:
 * - 204 No Content (hard-deleted)
 * - 200 OK with `{ status: 'archived' }` (soft-deleted)
 *
 * Both are treated as successful deletes. The fundraiser is removed from the
 * UI list, and archived fundraisers are never returned by the list API.
 *
 * `platformFetch` throws on non-2xx responses, so reaching the end of this
 * function means the delete succeeded.
 */
export async function deleteFundraiser(
  id: string,
  token: string
): Promise<void> {
  await platformFetch(`/fundraisers/${id}`, {
    method: 'DELETE',
    token,
  });
}
