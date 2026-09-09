import type {
  Fundraiser,
  FundraiserTransition,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';
import type { RawFundraiser } from './normalize-fundraiser';

import { cache } from 'react';
import { normalizeFundraiser } from './normalize-fundraiser';
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
  return normalizeFundraiser(
    await platformFetch<RawFundraiser>(fundraiserPath(slug, locale))
  );
}

export async function getFundraiserAuthenticated(
  slug: string,
  token: string
): Promise<Fundraiser> {
  return normalizeFundraiser(
    await platformFetch<RawFundraiser>(
      `/fundraisers/${encodeURIComponent(slug)}`,
      { token }
    )
  );
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
  return normalizeFundraiser(
    await platformFetch<RawFundraiser>(`/fundraisers/${id}`, {
      method: 'PUT',
      body: data,
      token,
    })
  );
}

/**
 * Applies one `fundraiser_lifecycle` transition.
 *
 * The status is not writable through PUT: the platform's state machine owns it, and this is the
 * only way to change it. A transition the current status forbids comes back as a 400 whose
 * `details.allowedTransitions` lists what the fundraiser would accept instead.
 *
 * Only `reactivate` takes a payload (a future `endDate`).
 */
export async function applyFundraiserTransition(
  id: string,
  transition: FundraiserTransition,
  token: string,
  payload?: Record<string, unknown>
): Promise<Fundraiser> {
  return normalizeFundraiser(
    await platformFetch<RawFundraiser>(
      `/fundraisers/${id}/transition/${transition}`,
      {
        method: 'POST',
        body: payload ?? {},
        token,
      }
    )
  );
}

/** Takes a draft live. */
export function publishFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return applyFundraiserTransition(id, 'publish', token);
}

export function pauseFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return applyFundraiserTransition(id, 'pause', token);
}

/** Brings a paused fundraiser back. A draft is published, not resumed. */
export function resumeFundraiser(
  id: string,
  token: string
): Promise<Fundraiser> {
  return applyFundraiserTransition(id, 'resume', token);
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
