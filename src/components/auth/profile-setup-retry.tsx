'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Retries a profile that could not be created at sign-in.
 *
 * Signup is implicit, so a user whose profile creation failed is signed in but incomplete. Rather than interrupt them, this quietly tries again on each navigation until it succeeds.
 * Deliberately silent: the donation form already falls back to its guest fields when there is no usable profile, so there is nothing the user needs to act on.
 */
export function ProfileSetupRetry() {
  const pathname = usePathname();
  const profileStatus = useAuthStore(state => state.profileStatus);
  const retryProfileSetup = useAuthStore(state => state.retryProfileSetup);

  useEffect(() => {
    if (profileStatus === 'ready') return;

    void retryProfileSetup();
    // `pathname` is the trigger: one attempt per navigation, not per render.
  }, [pathname, profileStatus, retryProfileSetup]);

  return null;
}
