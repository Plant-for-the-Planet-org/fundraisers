import type { RedirectPath } from '@/lib/types/auth';

import {
  buildSignupAuthorizeUrl,
  buildSocialAuthorizeUrl,
  buildUniversalLoginAuthorizeUrl,
  exchangeCodeForTokens,
} from '@/lib/auth/auth0-config';
import { clearOAuthState } from '@/lib/auth/oauth-state';
import { openSignInPopup, waitForSignInPopup } from '@/lib/auth/sign-in-popup';
import { useAuthStore } from '@/stores/auth-store';

export type SignInRequest =
  | { method: 'email'; email: string }
  | { method: 'signup'; email?: string }
  | { method: 'social'; connection: string };

export type SignInOutcome =
  /** The page is navigating to Auth0. Nothing more to do here. */
  'redirecting' | 'signed-in' | 'cancelled' | 'failed' | 'verify-email';

function buildAuthorizeUrl(
  request: SignInRequest,
  redirectTo: RedirectPath
): Promise<string> {
  switch (request.method) {
    case 'email':
      return buildUniversalLoginAuthorizeUrl(redirectTo, request.email);
    case 'signup':
      return buildSignupAuthorizeUrl(redirectTo, request.email || undefined);
    case 'social':
      return buildSocialAuthorizeUrl(request.connection, redirectTo);
  }
}

/** Today's flow: the whole tab goes to Auth0 and comes back through /redirecting. */
export async function signInWithRedirect(
  request: SignInRequest,
  redirectTo: RedirectPath
): Promise<'redirecting'> {
  const url = await buildAuthorizeUrl(request, redirectTo);
  window.location.assign(url);
  return 'redirecting';
}

/**
 * Auth0 runs in a popup and this tab keeps its page. Falls back to the redirect flow when the popup is blocked.
 * Call from a click handler: the popup must open before the first await.
 */
export async function signInWithPopup(
  request: SignInRequest,
  redirectTo: RedirectPath
): Promise<SignInOutcome> {
  const popup = openSignInPopup();
  if (!popup) return signInWithRedirect(request, redirectTo);

  let url: string;
  try {
    url = await buildAuthorizeUrl(request, redirectTo);
  } catch (error) {
    popup.close();
    throw error;
  }
  popup.location.replace(url);

  const result = await waitForSignInPopup(popup);

  if (result.status === 'cancelled') return 'cancelled';
  if (result.status === 'error') {
    return result.destination === '/verify-email' ? 'verify-email' : 'failed';
  }

  const tokens = await exchangeCodeForTokens(result.code);
  if (result.state) clearOAuthState(result.state);

  const auth = useAuthStore.getState();
  await auth.setAccessToken(tokens.access_token);
  return useAuthStore.getState().isAuthenticated ? 'signed-in' : 'failed';
}
