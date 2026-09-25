'use client';

import { buildShareUrl } from '@/lib/share/links';
import { getReferralCode } from '@/lib/share/referral';
import { useAuthStore } from '@/stores/auth-store';
import { useOrigin } from '@/components/share/use-origin';

/**
 * The link a Copy Link button copies: on the fundraiser page (sidebar and Share images dialog) and on the thank-you screen, told apart by `source`.
 * Built from the canonical path, so the viewer's own landing params (someone else's `ref`, their UTM tags) never travel with it. It carries the viewer's own code instead. Tokens are listed in docs/naming.md.
 * Undefined until the origin is known in the browser.
 */
export function useFundraiserShareUrl(
  slug: string,
  source: 'fundraiser' | 'thank_you' = 'fundraiser'
): string | undefined {
  const origin = useOrigin();
  const refCode = getReferralCode(useAuthStore(state => state.user?.profile));
  if (!origin || !slug) return undefined;
  return buildShareUrl({
    origin,
    slug,
    source,
    medium: 'copy_link',
    ref: refCode,
  });
}
