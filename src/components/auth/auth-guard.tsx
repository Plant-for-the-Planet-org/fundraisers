'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getAccessTokenSilently } from '@/lib/auth/auth0-config';
import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { isTokenExpired } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Loader } from '../ui/loader';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const tAuth = useTranslations('Auth');
  const accessToken = useAuthStore(state => state.accessToken);
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const search = searchParams.toString();
  const currentPath = search ? `${pathname}?${search}` : pathname;

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
          router.replace(getSignInPath(currentPath));
        } catch (err) {
          console.error('Silent auth failed:', err);
          clearAuth();
          router.replace(getSignInPath(currentPath));
        }
      }
    };

    checkToken();
  }, [
    accessToken,
    isAuthInitializing,
    setAccessToken,
    clearAuth,
    router,
    currentPath,
  ]);

  useEffect(() => {
    if (isAuthInitializing) return;
    if (!isAuthenticated) {
      router.replace(getSignInPath(currentPath));
    }
  }, [isAuthInitializing, isAuthenticated, router, currentPath]);

  if (isAuthInitializing || !isAuthenticated) {
    return fallback ?? <Loader text={tAuth('redirecting')} />;
  }

  return <>{children}</>;
}
