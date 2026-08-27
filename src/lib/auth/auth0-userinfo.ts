import type { Auth0UserInfo } from '../types/auth';

import { AUTH0_CONFIG } from './auth0-config';

const USERINFO_TIMEOUT = 5000;

/**
 * Read the signed-in user's name claims from Auth0.
 *
 * The access token carries no name, only a namespaced email, so this is the only way to learn a real name at signup.
 * Returns null on any failure: a missing name is not worth failing a signup over, since we can still derive one from the email.
 */
export async function fetchUserInfo(
  accessToken: string
): Promise<Auth0UserInfo | null> {
  try {
    const response = await fetch(`${AUTH0_CONFIG.issuerBaseURL}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(USERINFO_TIMEOUT),
    });

    if (!response.ok) {
      console.warn(`Auth0 /userinfo returned ${response.status}`);
      return null;
    }

    return (await response.json()) as Auth0UserInfo;
  } catch (error) {
    console.warn('Auth0 /userinfo failed:', error);
    return null;
  }
}
