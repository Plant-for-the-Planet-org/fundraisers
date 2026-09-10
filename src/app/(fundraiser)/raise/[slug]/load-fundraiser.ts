import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';

export type FundraiserLoadResult =
  | { kind: 'found'; fundraiser: Fundraiser; paymentOptions?: PaymentOptions }
  /** The anonymous fetch was refused. The caller falls back to `FundraiserAuthRetry`, which retries once signed in. */
  | { kind: 'auth-retry' }
  /** No fundraiser exists at this identifier, under any auth. */
  | { kind: 'not-found' }
  /** Resolved by id rather than by its own slug. The caller should redirect to the canonical URL. */
  | { kind: 'canonical-slug'; fundraiser: Fundraiser };

/**
 * Loads the fundraiser for a route nested under `/raise/[slug]`, with the same error handling and
 * canonical-slug check the raise page itself uses. Shared so routes like the invite page render the
 * same fundraiser the same way instead of duplicating this logic.
 */
export async function loadFundraiserForRoute(
  slug: string,
  locale: string
): Promise<FundraiserLoadResult> {
  let fundraiser: Fundraiser;
  try {
    fundraiser = await getCachedFundraiser(slug, locale);
  } catch (e) {
    if (e instanceof PlatformAPIError && e.status) {
      if ([401, 403, 404].includes(e.status)) return { kind: 'auth-retry' };
      if (e.status === 405) return { kind: 'not-found' };
    }
    throw e;
  }

  // A fundraiser resolves by GUID as well as by its exact slug, so one fundraiser is reachable at
  // two URLs. Hosts can also rename a slug, so the canonical form is whatever the fundraiser
  // currently reports rather than the URL used to reach it.
  if (fundraiser.slug && fundraiser.slug !== slug) {
    return { kind: 'canonical-slug', fundraiser };
  }

  let paymentOptions: PaymentOptions | undefined;
  if (fundraiser.canDonate) {
    try {
      paymentOptions = await getPaymentOptions(fundraiser.id);
    } catch (e) {
      if (!(e instanceof PlatformAPIError)) throw e;
    }
  }

  return { kind: 'found', fundraiser, paymentOptions };
}
