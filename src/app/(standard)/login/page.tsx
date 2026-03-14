'use client';

import { Loader } from '@/components/ui/loader';
import { SignInHeroImage } from '../../../components/auth/sign-in-hero-image';
import { SignInFormPanel } from '@/components/auth/sign-in-form-panel';
import { getSafeRedirectPath } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';

export default function LoginPage() {
  const tAuth = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirectPath = getSafeRedirectPath(searchParams.get('redirectTo'));
  // store: state
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (isAuthInitializing) return <Loader text={tAuth('redirecting')} />;

  if (isAuthenticated) {
    router.replace(DEFAULT_REDIRECT_PATH);
    return;
  }

  return (
    <div className='flex flex-col lg:flex-row'>
      {/* Left side - Hero Image with Tagline (hidden on mobile, shown on desktop) */}
      <SignInHeroImage />

      {/* Right side - Login (order-1 on mobile, order-2 on desktop) */}
      <SignInFormPanel redirectTo={safeRedirectPath} />
    </div>
  );
}
