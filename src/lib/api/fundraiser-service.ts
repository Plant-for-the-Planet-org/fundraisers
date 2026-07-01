import type {
  Fundraiser,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';

import { cache } from 'react';
import { platformFetch, platformFetchWithResponse } from './platform-fetch';

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

export type DeleteFundraiserResult =
  | { archived: false }
  | { archived: true; fundraiser: Fundraiser | null };

/**
 * Deletes a fundraiser. The API has two success shapes, distinguished by
 * HTTP status (not by whether a body is present — a 200 can come back empty):
 * - 204 No Content: no donations, hard-deleted. Caller removes the row.
 * - 200 OK: had donations, soft-deleted to `status: 'archived'`. The body is
 *   the updated fundraiser, but may be empty; caller keeps the row and, if the
 *   body is missing, patches `status` locally.
 */
export async function deleteFundraiser(
  id: string,
  token: string
): Promise<DeleteFundraiserResult> {
  const { status, data } = await platformFetchWithResponse<Fundraiser>(
    `/fundraisers/${id}`,
    { method: 'DELETE', token }
  );

  if (status === 204) {
    return { archived: false };
  }
  return { archived: true, fundraiser: data ?? null };
}
