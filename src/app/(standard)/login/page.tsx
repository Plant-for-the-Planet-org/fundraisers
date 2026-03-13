'use client';
import type { RedirectPath } from '@/lib/types/auth';

import { DEFAULT_REDIRECT_PATH } from '@/lib/types/auth';
import { ALLOWED_REDIRECTS } from '@/lib/types/auth';
import { useEffect } from 'react';
import { SignInHeroImage } from '../../../components/auth/sign-in-hero-image';
import { SignInFormPanel } from '@/components/auth/sign-in-form-panel';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader } from '@/components/ui/loader';

export function isAllowedRedirect(path: string): path is RedirectPath {
  return ALLOWED_REDIRECTS.includes(path as RedirectPath);
}
export function getSafeRedirect(path: string | null): RedirectPath {
  if (path && isAllowedRedirect(path)) {
    return path;
  }
  return DEFAULT_REDIRECT_PATH;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations('Auth');
  const logoutSuccess = searchParams.get('logoutSuccess');
  const safeRedirect = getSafeRedirect(searchParams.get('redirectTo'));

  useEffect(() => {
    if (logoutSuccess !== 'true') return;

    // Small delay to ensure logout is processed, then redirect
    const timer = setTimeout(() => {
      router.replace(safeRedirect);
    }, 100);

    return () => clearTimeout(timer);
  }, [logoutSuccess, safeRedirect, router]);

  if (logoutSuccess === 'true') {
    return <Loader text={tAuth('redirecting')} />;
  }

  return (
    <div className='flex flex-col lg:flex-row'>
      {/* Left side - Hero Image with Tagline (hidden on mobile, shown on desktop) */}
      <SignInHeroImage />

      {/* Right side - Login (order-1 on mobile, order-2 on desktop) */}
      <SignInFormPanel redirectTo={safeRedirect} />
    </div>
  );
}
