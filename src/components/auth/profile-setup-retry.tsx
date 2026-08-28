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

  useEffect(() => {
    // Read the store at call time rather than subscribing to it. Subscribing would make the status change its own trigger, so a failure would immediately retry itself with no backoff.
    const { profileStatus, retryProfileSetup } = useAuthStore.getState();
    if (profileStatus === 'ready') return;

    void retryProfileSetup();
  }, [pathname]);

  return null;
}
