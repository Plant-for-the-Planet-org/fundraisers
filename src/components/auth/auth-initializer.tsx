'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  exchangeCodeForTokens,
  getAccessTokenSilently,
} from '@/lib/auth/auth0-config';
import { cleanUrl, getValidStoredToken } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';

async function handleCodeExchange(code: string) {
  cleanUrl(['code']);
  const tokens = await exchangeCodeForTokens(code);
  return tokens.access_token;
}

export function AuthInitializer() {
  const tAuth = useTranslations('Auth');
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const logoutSuccess = searchParams.get('logoutSuccess');
  // store: actions
  const setIsAuthInitializing = useAuthStore(
    state => state.setIsAuthInitializing
  );
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const clearAuth = useAuthStore(state => state.clearAuth);
  // Guard against effect re-runs caused by URL changes (cleanUrl() removing
  // `code`, post-callback navigation, etc.). The async init must run exactly
  // once per mount — a re-run while the first invocation is still in flight
  // sees an empty localStorage and kicks off a redundant silent-auth call,
  // whose setAccessToken then overwrites the one from the original exchange.
  const didStartInit = useRef(false);

  useEffect(() => {
    // Silent auth opens a hidden iframe that lands on /redirecting?code=X.
    // AuthInitializer lives in the root layout, so it mounts inside the iframe
    // too — but that instance has no in-memory PKCE verifier and would fail
    // the code exchange, then wipe access_token from localStorage (which is
    // shared across same-origin frames).
    if (typeof window !== 'undefined' && window.self !== window.top) return;
    if (logoutSuccess === 'true') return;
    if (didStartInit.current) return;
    didStartInit.current = true;
    const init = async () => {
      try {
        // 1. Handle PKCE code exchange
        if (code) {
          const token = await handleCodeExchange(code);
          await setAccessToken(token);
          return;
        }
        // 2. Previous auth failed
        if (error === 'auth_failed') {
          console.warn('Auth previously failed, skipping silent auth');
          cleanUrl(['error', 'reason']);
          toast.error(tAuth('signInError'));
          return;
        }

        // 3. Check token from localStorage
        const storedToken = getValidStoredToken();
        if (storedToken) {
          await setAccessToken(storedToken);
          return;
        }

        // 4. Try silent authentication
        const silentToken = await getAccessTokenSilently();
        if (silentToken) {
          await setAccessToken(silentToken);
          return;
        }

        // 5. Final fallback check
        const fallbackToken = getValidStoredToken();
        if (fallbackToken) {
          await setAccessToken(fallbackToken);
        }
      } catch (err) {
        console.error('Auth init failed:', err);
        clearAuth();
        toast.error(tAuth('signInError'));
      } finally {
        setIsAuthInitializing(false);
      }
    };

    init();
  }, [
    clearAuth,
    logoutSuccess,
    setAccessToken,
    setIsAuthInitializing,
    code,
    error,
    tAuth,
  ]);

  useEffect(() => {
    if (logoutSuccess === 'true') clearAuth();
  }, [clearAuth, logoutSuccess]);

  return null;
}
