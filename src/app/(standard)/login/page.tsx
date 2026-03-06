'use client';

import { useEffect } from 'react';
import { SignInHeroImage } from '../../../components/auth/sign-in-hero-image';
import { SignInFormPanel } from '@/components/auth/sign-in-form-panel';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader } from '@/components/ui/loader';

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
