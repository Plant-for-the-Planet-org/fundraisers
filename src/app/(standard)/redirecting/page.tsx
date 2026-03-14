'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader } from '@/components/ui/loader';
import { cleanUrl, getSafeRedirectPath } from '@/lib/utils/auth';
import { clearOAuthState, getStoredOAuthState } from '@/lib/auth/oauth-state';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';

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

  useEffect(() => {
    if (nonce) {
      cleanUrl(['state']);
      const redirectTo = nonce
        ? (getStoredOAuthState(nonce) ?? DEFAULT_REDIRECT_PATH)
        : DEFAULT_REDIRECT_PATH;

      clearOAuthState(nonce);

      router.replace(redirectTo);
      return;
    }

    if (logoutSuccess === 'true') {
      router.replace(safeRedirectPath);
    }
  }, [logoutSuccess, router, safeRedirectPath, nonce]);

  return <Loader text={tAuth('redirecting')} />;
}
