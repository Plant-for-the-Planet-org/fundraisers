'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getAccessTokenSilently } from '@/lib/auth/auth0-config';
import { isTokenExpired } from '@/lib/auth/jwt-utils';
import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { useAuthStore } from '@/stores/authStore';
import { Loader } from '../ui/loader';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const tAuth = useTranslations('Auth');
  const accessToken = useAuthStore(state => state.accessToken);
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const clearAuth = useAuthStore(state => state.clearAuth);

  useEffect(() => {
    const checkToken = async () => {
      if (isAuthInitializing || !accessToken) return;
      // Check if token expired
      if (isTokenExpired(accessToken)) {
        try {
          const newToken = await getAccessTokenSilently();

          if (newToken) {
            await setAccessToken(newToken);
            return;
          }

          clearAuth();
          router.replace(getSignInPath());
        } catch (err) {
          console.error('Silent auth failed:', err);
          clearAuth();
          router.replace(getSignInPath());
        }
      }
    };

    checkToken();
  }, [accessToken, isAuthInitializing, setAccessToken, clearAuth, router]);

  /**
   * Redirect unauthenticated users
   */
  useEffect(() => {
    if (!isAuthInitializing && !isAuthenticated) {
      router.replace(getSignInPath());
    }
  }, [isAuthenticated, isAuthInitializing, router]);

  /**
   * Show loader while auth state is initializing
   */
  if (isAuthInitializing) {
    return fallback ?? <Loader text={tAuth('redirecting')} />;
  }

  /**
   * Prevent UI flicker before redirect happens
   */
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
