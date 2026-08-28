import type { Auth0UserInfo } from '../types/auth';

import { AUTH0_CONFIG } from './auth0-config';

const USERINFO_TIMEOUT = 5000;

/**
 * `revoked` means Auth0 no longer recognises the token's user, which happens when the account is deleted.
 * `unavailable` covers everything else, where we simply did not learn a name.
 */
export type UserInfoResult =
  | { status: 'ok'; userInfo: Auth0UserInfo }
  | { status: 'revoked' }
  | { status: 'unavailable' };

/**
 * Read the signed-in user's name claims from Auth0.
 *
 * The access token carries no name, only a namespaced email, so this is the only way to learn a real name at signup.
 * A failure is not worth failing a signup over, since we can derive a name from the email. The one exception is a 401: the platform verifies tokens offline, so it still accepts a token whose Auth0 user has been deleted, and only Auth0 can tell us that identity is gone.
 */
export async function fetchUserInfo(
  accessToken: string
): Promise<UserInfoResult> {
  try {
    const response = await fetch(`${AUTH0_CONFIG.issuerBaseURL}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(USERINFO_TIMEOUT),
    });

    if (response.status === 401) return { status: 'revoked' };

    if (!response.ok) {
      console.warn(`Auth0 /userinfo returned ${response.status}`);
      return { status: 'unavailable' };
    }

    return { status: 'ok', userInfo: (await response.json()) as Auth0UserInfo };
  } catch (error) {
    console.warn('Auth0 /userinfo failed:', error);
    return { status: 'unavailable' };
  }
}
