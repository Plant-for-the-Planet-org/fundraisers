import type { Fundraiser } from '@/lib/types/fundraiser';

import { getFundraiserUrl } from '@/lib/utils/fundraiser';

/** Payload shape shared by the native Web Share API and every share target. */
export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Builds the share payload for a fundraiser.
 *
 * `text` is supplied by the caller (config-driven via `buildShareText`) so this
 * stays pure and reusable by every current and future share target.
 */
export function buildFundraiserShareData(
  fundraiser: Pick<Fundraiser, 'id' | 'slug' | 'title'>,
  origin: string,
  text: string
): ShareData {
  return {
    title: fundraiser.title,
    text,
    url: `${origin}${getFundraiserUrl(fundraiser)}`,
  };
}
