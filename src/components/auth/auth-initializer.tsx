'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  exchangeCodeForTokens,
  getAccessTokenSilently,
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
    const getValidStoredToken = () => {
      const token = localStorage.getItem('access_token');

      if (!token) return null;

      if (isTokenExpired(token)) {
        localStorage.removeItem('access_token');
        return null;
      }

      return token;
    };

    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        // 1. Handle PKCE code exchange
        if (code) {
          const token = await handleCodeExchange(code);
          await setAccessToken(token);
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
  }, []);

  return null;
}
