'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { clearOAuthState, getStoredOAuthState } from '@/lib/auth/oauth-state';
import {
  isSignInPopupWindow,
  postSignInCodeToOpener,
} from '@/lib/auth/sign-in-popup';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';
import { cleanUrl, getSafeRedirectPath } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Loader } from '@/components/ui/loader';

/**
 * Handles post-authentication and post-logout redirects.
 *
 * Post-login flow:
 * - Auth0 callback route (/api/auth/callback) forwards the `state` nonce here.
 * - The nonce is used to look up the original redirect target from sessionStorage (via getStoredOAuthState).
 * - OAuth state is cleared and the user is forwarded to their intended destination.
 *
 * Post-logout flow:
 * - Auth0 logout returns the user to this page with `logoutSuccess=true&redirectTo=<path>`.
 * - The user is forwarded to the safe redirect path.
 */

export default function RedirectingPage() {
  const tAuth = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirectTo');
  const logoutSuccess = searchParams.get('logoutSuccess');
  const safeRedirectPath = getSafeRedirectPath(redirectPath);
  const nonce = searchParams.get('state');
  const code = searchParams.get('code');
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  useEffect(() => {
    // Popup sign-in: the opener owns the PKCE verifier and finishes the exchange. AuthInitializer stays idle in this window, so isAuthInitializing never settles here.
    if (code && isSignInPopupWindow()) {
      if (postSignInCodeToOpener(code, nonce)) window.close();
      return;
    }

    if (nonce) {
      // Wait until auth finishes, so the destination loads ready instead of
      // briefly showing AuthGuard's "Redirecting you..." loader.
      if (isAuthInitializing) return;

      cleanUrl(['state']);
      const redirectTo = getStoredOAuthState(nonce) ?? DEFAULT_REDIRECT_PATH;

      clearOAuthState(nonce);

      router.replace(redirectTo);
      return;
    }

    if (logoutSuccess === 'true') {
      router.replace(safeRedirectPath);
    }
  }, [
    logoutSuccess,
    router,
    safeRedirectPath,
    nonce,
    code,
    isAuthInitializing,
  ]);

  const getLoaderKey = () => {
    if (nonce) return 'signingIn';
    if (logoutSuccess === 'true') return 'signingOut';
    return 'redirecting';
  };

  return <Loader text={tAuth(getLoaderKey())} />;
}
