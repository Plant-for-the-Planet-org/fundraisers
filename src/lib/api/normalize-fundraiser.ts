import type { Fundraiser, FundraiserWorkspace } from '@/lib/types/fundraiser';

import { toAllowedCountry } from '@/lib/utils/country-currency';

/**
 * A workspace exactly as it arrives from the ForestCloud API: the same shape as
 * `FundraiserWorkspace`, except `country` is an unnormalized raw string — any
 * case, and possibly a country that has no workspace of its own.
 */
type RawWorkspace = Omit<FundraiserWorkspace, 'country'> & {
  country?: string | null;
};

/**
 * A fundraiser as it arrives from the ForestCloud API, before domain
 * normalization. `workspace` may be a populated object, an empty array
 * (ForestCloud's "no workspace" shape) or absent.
 */
export type RawFundraiser = Omit<Fundraiser, 'workspace'> & {
  workspace?: RawWorkspace | RawWorkspace[] | null;
};

/**
 * Coerce a raw API workspace into the domain shape. ForestCloud returns `[]`
 * (not `null`) when a fundraiser has no workspace, so any array is treated as
 * "no workspace".
 */
function normalizeWorkspace(
  workspace: RawFundraiser['workspace']
): FundraiserWorkspace | null {
  if (!workspace || Array.isArray(workspace)) {
    return null;
  }
  return {
    ...workspace,
    // The single boundary where the raw API country becomes an
    // `AllowedCountry`. Unsupported / empty / wrong-case values fall back to
    // `ROW` (served by DE), matching the pre-registry behavior and keeping the
    // declared `FundraiserWorkspace.country: AllowedCountry` true at runtime so
    // downstream registry lookups can never receive an invalid value.
    country: toAllowedCountry(workspace.country),
  };
}

/**
 * Normalize a raw API fundraiser into the domain `Fundraiser`. Every
 * API-to-domain path (single fetch, list, create, update, category listings)
 * must run its responses through this so `workspace.country` is always a valid
 * `AllowedCountry`.
 */
export function normalizeFundraiser(fundraiser: RawFundraiser): Fundraiser {
  return {
    ...fundraiser,
    workspace: normalizeWorkspace(fundraiser.workspace),
  };
}
