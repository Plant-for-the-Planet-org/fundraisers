import type { UserProfileResponse } from '@/lib/api/user-service';

import { isValidRefCode, REF_PARAM } from './links';

/**
 * The `ref` code in a page's query string, or null.
 * Read from the URL whenever it is needed, never stored: the donation overlay stays on the page, so the code is still in the URL at submit time. See docs/cookie-consent-stance.md.
 */
export function readRefParam(search: string): string | null {
  const value = new URLSearchParams(search).get(REF_PARAM)?.trim();
  return isValidRefCode(value) ? value : null;
}

/** The person's own code, for tagging the links they share. Null until the platform returns one. */
export function getReferralCode(
  profile: Pick<UserProfileResponse, 'referralCode'> | null | undefined
): string | null {
  const code = profile?.referralCode;
  return isValidRefCode(code) ? code : null;
}
