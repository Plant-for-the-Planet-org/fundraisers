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

/**
 * Pauses an active fundraiser using
 * `POST /fundraisers/{id}/transition/pause`.
 *
 * The backend handles the status transition.
 */
export function pauseFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>(`/fundraisers/${id}/transition/pause`, {
    method: 'POST',
    token,
  });
}

/**
 * Resumes a paused fundraiser using
 * `POST /fundraisers/{id}/transition/resume`.
 *
 * The backend handles the status transition.
 */
export function resumeFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>(`/fundraisers/${id}/transition/resume`, {
    method: 'POST',
    token,
  });
}

/**
 * Extends an active fundraiser by updating its end date.
 *
 * Uses a partial update and only sends `{ endDate }`, leaving all other
 * fundraiser fields unchanged.
 */
export function extendActiveFundraiser(
  id: string,
  endDate: string,
  token: string
): Promise<Fundraiser> {
  return updateFundraiser(id, { endDate }, token);
}

/**
 * Reactivates a fundraiser with a new end date.
 *
 * Uses `POST /fundraisers/{id}/transition/reactivate`.
 * The backend handles the status transition.
 */
export function reactivateAndExtendFundraiser(
  id: string,
  endDate: string,
  token: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>(`/fundraisers/${id}/transition/reactivate`, {
    method: 'POST',
    body: { endDate },
    token,
  });
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
