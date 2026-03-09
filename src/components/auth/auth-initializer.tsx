'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  exchangeCodeForTokens,
  trySignInSilently,
} from '@/lib/auth/auth0-config';
import { isTokenExpired } from '../../lib/auth/jwt-utils';

function cleanUrl(params: string[]) {
  const url = new URL(window.location.href);
  params.forEach(p => url.searchParams.delete(p));
  window.history.replaceState({}, '', url.pathname + url.search);
}

async function handleCodeExchange(code: string) {
  cleanUrl(['code']);
  const tokens = await exchangeCodeForTokens(code);
  return tokens.access_token;
}

export function AuthInitializer() {
  const setIsAuthInitializing = useAuthStore(
    state => state.setIsAuthInitializing
  );
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const clearAuth = useAuthStore(state => state.clearAuth);

  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const tokenFromUrl = urlParams.get('access_token');

        // Case 1 — PKCE code exchange
        if (code) {
          const token = await handleCodeExchange(code);
          await setAccessToken(token);
          return;
        }

        // Case 2 — Token directly in URL
        if (tokenFromUrl) {
          cleanUrl(['access_token']);
          await setAccessToken(tokenFromUrl);
          return;
        }

        // Case 3 — Previously stored token
        const storedToken = localStorage.getItem('access_token');

        if (storedToken) {
          /**
           * IMPORTANT:
           * Check if the stored JWT is expired before reusing it.
           * Using an expired token would cause API calls to fail with 401.
           */
          if (!isTokenExpired(storedToken)) {
            await setAccessToken(storedToken);
            return;
          }

          localStorage.removeItem('access_token');
        }

        const silentToken = await trySignInSilently();

        if (silentToken) {
          await setAccessToken(silentToken);
        }
      } catch (err) {
        console.error('Auth init failed:', err);
        clearAuth();
      } finally {
        setIsAuthInitializing(false);
      }
    };

    init();
  }, []);

  return null;
}
