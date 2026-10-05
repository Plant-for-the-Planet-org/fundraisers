import type { RedirectPath } from '@/lib/types/auth';

import {
  buildSignupAuthorizeUrl,
  buildSocialAuthorizeUrl,
  buildUniversalLoginAuthorizeUrl,
  exchangeCodeForTokens,
} from '@/lib/auth/auth0-config';
import { clearOAuthState, getStoredOAuthState } from '@/lib/auth/oauth-state';
import { openSignInPopup, waitForSignInPopup } from '@/lib/auth/sign-in-popup';
import { useAuthStore } from '@/stores/auth-store';

export type SignInRequest =
  | { method: 'email'; email: string }
  | { method: 'signup'; email?: string }
  | { method: 'social'; connection: string };

export interface SignInOptions {
  /** Ask Auth0 for credentials even though a session exists. This is how a signed-in person switches accounts. */
  forceLogin?: boolean;
}

export type SignInOutcome =
  /** The page is navigating to Auth0. Nothing more to do here. */
  'redirecting' | 'signed-in' | 'cancelled' | 'failed' | 'verify-email';

function buildRequestUrl(
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

async function buildAuthorizeUrl(
  request: SignInRequest,
  redirectTo: RedirectPath,
  options: SignInOptions
): Promise<string> {
  const url = await buildRequestUrl(request, redirectTo);
  if (!options.forceLogin) return url;

  const withPrompt = new URL(url);
  withPrompt.searchParams.set('prompt', 'login');
  return withPrompt.toString();
}

/** Today's flow: the whole tab goes to Auth0 and comes back through /redirecting. */
export async function signInWithRedirect(
  request: SignInRequest,
  redirectTo: RedirectPath,
  options: SignInOptions = {}
): Promise<'redirecting'> {
  const url = await buildAuthorizeUrl(request, redirectTo, options);
  window.location.assign(url);
  return 'redirecting';
}

/**
 * Auth0 runs in a popup and this tab keeps its page. Falls back to the redirect flow when the popup is blocked.
 * Call from a click handler: the popup must open before the first await.
 */
export async function signInWithPopup(
  request: SignInRequest,
  redirectTo: RedirectPath,
  options: SignInOptions = {}
): Promise<SignInOutcome> {
  const popup = openSignInPopup();
  if (!popup) return signInWithRedirect(request, redirectTo, options);

  let url: string;
  try {
    url = await buildAuthorizeUrl(request, redirectTo, options);
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

  // Only exchange a code for an attempt this tab started. The nonce was stored when the authorize URL was built. A stale or foreign callback would otherwise burn the active PKCE verifier, since a failed exchange clears it.
  if (!result.state || getStoredOAuthState(result.state) === null) {
    console.warn('Sign-in popup returned an unknown state, ignoring.');
    return 'failed';
  }

  const tokens = await exchangeCodeForTokens(result.code);
  clearOAuthState(result.state);

  const auth = useAuthStore.getState();

  // If a user is already signed in, only replace the current session if the new account loads successfully.
  if (auth.isAuthenticated) {
    const switched = await auth.switchAccount(tokens.access_token);
    return switched ? 'signed-in' : 'failed';
  }

  await auth.setAccessToken(tokens.access_token);
  return useAuthStore.getState().isAuthenticated ? 'signed-in' : 'failed';
}
