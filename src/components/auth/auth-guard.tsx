'use client';

import { redirectToLogin } from '@/lib/auth/sign-in-redirect';
import { useAuthStore } from '@/stores/authStore';
import { useTranslations } from 'next-intl';
import { Loader } from '../ui/loader';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const tAuth = useTranslations('Auth');

  if (!isAuthenticated && !isAuthInitializing) {
    redirectToLogin();
    return null;
  }

  if (isAuthInitializing) {
    return fallback ?? <Loader text={tAuth('redirecting')} />;
  }

  return <>{children}</>;
}
