'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSafeRedirectPath } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';
import { SignInCard } from '@/components/auth/sign-in-card';
import { SignInHeroImage } from '@/components/auth/sign-in-hero-image';
import { Loader } from '@/components/ui/loader';

export default function LoginPage() {
  const tAuth = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirectPath = getSafeRedirectPath(searchParams.get('redirectTo'));
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthInitializing) return;
    if (isAuthenticated) {
      router.replace(safeRedirectPath);
    }
  }, [isAuthInitializing, isAuthenticated, router, safeRedirectPath]);

  if (isAuthInitializing || isAuthenticated) {
    return <Loader text={tAuth('redirecting')} />;
  }

  return (
    <div className='flex flex-col lg:flex-row lg:items-stretch'>
      <SignInHeroImage />

      <section className='flex flex-1 items-center justify-center px-6 py-12 lg:px-12'>
        <div className='w-full max-w-sm'>
          <SignInCard
            variant='plain'
            returnTo={safeRedirectPath}
            onSignedIn={() => router.replace(safeRedirectPath)}
            header={
              <div className='space-y-1.5'>
                <h1 className='text-xl font-semibold leading-none'>
                  {tAuth('form.title')}
                </h1>
                <p className='text-sm text-muted-foreground'>
                  {tAuth('form.subtitle')}
                </p>
              </div>
            }
          />
        </div>
      </section>
    </div>
  );
}
