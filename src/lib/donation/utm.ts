import type { DonationUtm } from '../types/donation';
import type { Fundraiser } from '../types/fundraiser';

/**
 * `utm_id` is standard and unclaimed, so it is stored under its own name. Planet
 * widgets already forward it (see planet-widgets/utils/utmParams.js).
 *
 * `utm_campaign` is the exception: the platform reserves that key for the fundraiser
 * GUID and matches donations on it, so the URL's own campaign is kept under
 * `utm_campaign_name` instead.
 */
const UTM_PARAMS = [
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_id', 'utm_id'],
  ['utm_content', 'utm_content'],
  ['utm_term', 'utm_term'],
  ['utm_campaign', 'utm_campaign_name'],
] as const;

/** Anyone can craft a link, so cap the values before they reach the API. */
const MAX_VALUE_LENGTH = 200;

/** Fundraiser GUID, e.g. `fr_GhHeVDCYkqsh`. Same shape the platform matches on. */
const FUNDRAISER_GUID = /^fr_[a-zA-Z0-9]{12}$/;

export type FundraiserRef = Pick<Fundraiser, 'id' | 'hid'>;

/**
 * The legacy donate app addressed a fundraiser through `utm_campaign`, so old links
 * carry an identifier where a campaign name belongs.
 *
 * This is the fundraiser donation path, so the donation already belongs to a
 * fundraiser. Keeping a second reference would make it read as belonging to two,
 * so drop them all, our own and any other's. Project donations are a different
 * story: once they exist an inbound `fr_*` says which fundraiser sent the donor,
 * which is real attribution their path should keep.
 *
 * A foreign legacy HID slips through. Matching HIDs by shape would eat real campaign
 * names, and losing those is worse than keeping the odd stray identifier.
 */
function isFundraiserReference(
  value: string,
  fundraiser: FundraiserRef
): boolean {
  return FUNDRAISER_GUID.test(value) || value === fundraiser.hid;
}

export function parseUtmParams(
  search: string,
  fundraiser: FundraiserRef
): DonationUtm | undefined {
  const params = new URLSearchParams(search);
  const utm: DonationUtm = {};

  for (const [param, key] of UTM_PARAMS) {
    const value = params.get(param)?.trim();
    if (!value) continue;
    // Both carry a campaign identity, so both can arrive holding a fundraiser.
    if (
      (key === 'utm_campaign_name' || key === 'utm_id') &&
      isFundraiserReference(value, fundraiser)
    ) {
      continue;
    }

    utm[key] = value.slice(0, MAX_VALUE_LENGTH);
  }

  return Object.keys(utm).length > 0 ? utm : undefined;
}

/**
 * Reads the campaign off the current URL at submit time.
 *
 * The landing params are still there: the donate overlay never navigates, and the
 * login hand-off carries the query string out and back (see `getSignInPath`).
 * Nothing is stored on the device, so this needs no consent gate.
 */
export function getUtmParams(
  fundraiser: FundraiserRef
): DonationUtm | undefined {
  if (typeof window === 'undefined') return undefined;

  return parseUtmParams(window.location.search, fundraiser);
}
