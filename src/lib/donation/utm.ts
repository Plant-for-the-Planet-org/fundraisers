import type { DonationUtm } from '../types/donation';
import type { Fundraiser } from '../types/fundraiser';

/**
 * Every key is stored under its own standard name. Planet widgets already forward
 * `utm_id` (see planet-widgets/utils/utmParams.js).
 *
 * `utm_campaign` is absent, deliberately. The platform still reserves that key for
 * the fundraiser GUID and matches donations on it, so the URL's own campaign has
 * nowhere honest to go yet. Once FundraiserSubscriber associates on
 * `metadata.fundraiser.id` instead, add `utm_campaign` here and it lands correctly,
 * with no invented field to migrate away from.
 */
const UTM_PARAMS = [
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_id', 'utm_id'],
  ['utm_content', 'utm_content'],
  ['utm_term', 'utm_term'],
] as const;

/** Anyone can craft a link, so cap the values before they reach the API. */
const MAX_VALUE_LENGTH = 200;

/** Fundraiser GUID, e.g. `fr_GhHeVDCYkqsh`. Same shape the platform matches on. */
const FUNDRAISER_GUID = /^fr_[a-zA-Z0-9]{12}$/;

export type FundraiserRef = Pick<Fundraiser, 'id' | 'hid'>;

/**
 * Links built for the legacy donate app addressed a fundraiser through a campaign
 * field, so one can still arrive holding an identifier rather than a campaign.
 *
 * This is the fundraiser donation path, so the donation already belongs to a
 * fundraiser. Keeping a second reference would make it read as belonging to two,
 * so drop them all, our own and any other's. Project donations are a different
 * story: once they exist an inbound `fr_*` says which fundraiser sent the donor,
 * which is real attribution their path should keep.
 *
 * A foreign legacy HID slips through. Matching HIDs by shape would eat real campaign
 * ids, and losing those is worse than keeping the odd stray identifier.
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
    if (key === 'utm_id' && isFundraiserReference(value, fundraiser)) {
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
