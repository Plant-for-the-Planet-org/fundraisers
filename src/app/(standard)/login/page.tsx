import type { Metadata } from 'next';

import { Suspense } from 'react';
import { SignInHeroImage } from '../../../components/auth/sign-in-hero-image';
import { SignInFormPanel } from '@/components/auth/sign-in-form-panel';

export const metadata: Metadata = {
  title: 'Sign In | Fundraiser',
  description: 'Sign in to your account to continue making a difference',
};

export default function LoginPage() {
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
        <SignInFormPanel />
      </div>
    </Suspense>
  );
}
