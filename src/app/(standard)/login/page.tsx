'use client';

import { SignInHeroImage } from '../../../components/auth/sign-in-hero-image';
import { SignInFormPanel } from '@/components/auth/sign-in-form-panel';
import { getSafeRedirectPath } from '@/lib/utils/auth';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const safeRedirect = getSafeRedirectPath(searchParams.get('redirectTo'));

  return (
    <div className='flex flex-col lg:flex-row'>
      {/* Left side - Hero Image with Tagline (hidden on mobile, shown on desktop) */}
      <SignInHeroImage />

      {/* Right side - Login (order-1 on mobile, order-2 on desktop) */}
      <SignInFormPanel redirectTo={safeRedirect} />
    </div>
  );
}
