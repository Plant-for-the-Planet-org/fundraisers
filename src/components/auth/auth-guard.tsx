'use client';

import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { useAuthStore } from '@/stores/authStore';
import { useTranslations } from 'next-intl';
import { Loader } from '../ui/loader';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const tAuth = useTranslations('Auth');

  if (isAuthInitializing) {
    return fallback ?? <Loader text={tAuth('redirecting')} />;
  }

  if (!isAuthenticated && !isAuthInitializing) {
    // Redirect to sign in page
    router.push(getSignInPath());
    return null;
  }

  return <>{children}</>;
}
