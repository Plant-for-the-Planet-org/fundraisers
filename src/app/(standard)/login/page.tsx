'use client';

import { Suspense, useEffect } from 'react';
import { SignInHeroImage } from '../../../components/auth/sign-in-hero-image';
import { SignInFormPanel } from '@/components/auth/sign-in-form-panel';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations('Auth');
  const logoutSuccess = searchParams.get('logoutSuccess');
  const redirectTo = searchParams.get('redirectTo') || '/explore';

  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') ? redirectTo : '/explore';
  useEffect(() => {
    if (logoutSuccess !== 'true') return;

    // Small delay to ensure logout is processed, then redirect
    const timer = setTimeout(() => {
      router.replace(safeRedirect);
    }, 100);

    return () => clearTimeout(timer);
  }, [logoutSuccess, safeRedirect, router]);

  // Show logout success loading state
  if (logoutSuccess === 'true') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p className='text-gray-600'>{tAuth('redirecting')}</p>
        </div>
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
        </div>
      }
    >
      <div className='flex flex-col lg:flex-row'>
        {/* Left side - Hero Image with Tagline (hidden on mobile, shown on desktop) */}
        <SignInHeroImage />

        {/* Right side - Login (order-1 on mobile, order-2 on desktop) */}
        <SignInFormPanel redirectTo={safeRedirect} />
      </div>
    </Suspense>
  );
}
