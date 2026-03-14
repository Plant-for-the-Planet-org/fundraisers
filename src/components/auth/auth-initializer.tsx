'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  exchangeCodeForTokens,
  getAccessTokenSilently,
} from '@/lib/auth/auth0-config';
import { useSearchParams } from 'next/navigation';
import { cleanUrl, getValidStoredToken } from '@/lib/utils/auth';

async function handleCodeExchange(code: string) {
  cleanUrl(['code']);
  const tokens = await exchangeCodeForTokens(code);
  return tokens.access_token;
}

export function AuthInitializer() {
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

  useEffect(() => {
    if (logoutSuccess === 'true') return;
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
      } catch (error) {
        console.error('Auth init failed:', error);
        clearAuth();
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
  ]);

  useEffect(() => {
    if (logoutSuccess === 'true') clearAuth();
  }, [clearAuth, logoutSuccess]);

  return null;
}
