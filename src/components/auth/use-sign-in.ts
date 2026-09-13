'use client';

import type { SignInRequest } from '@/lib/auth/start-sign-in';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { signInWithPopup, signInWithRedirect } from '@/lib/auth/start-sign-in';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { getSafeRedirectPath } from '@/lib/utils/auth';

interface UseSignInOptions {
  /** Same-tab path with query to land on after sign-in. Unsafe paths fall back to the default. */
  returnTo: string | null;
  /** Runs after a successful popup sign-in. The redirect flow never gets here, the tab has left by then. */
  onSignedIn?: () => void;
}

/**
 * Shared start logic for the sign-in modal and the /login page.
 * Desktop uses the popup so the current page keeps its state. Small screens would open the popup as a new tab, so they use the redirect flow.
 */
export function useSignIn({ returnTo, onSignedIn }: UseSignInOptions) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const [isPending, setIsPending] = useState(false);

  const start = async (request: SignInRequest) => {
    if (isPending) return;
    setIsPending(true);

    const redirectTo = getSafeRedirectPath(returnTo);

    try {
      if (isSmallScreen) {
        await signInWithRedirect(request, redirectTo);
        return;
      }

      const outcome = await signInWithPopup(request, redirectTo);

      if (outcome === 'signed-in') {
        onSignedIn?.();
      } else if (outcome === 'verify-email') {
        router.push('/verify-email');
      } else if (outcome === 'failed') {
        toast.error(t('signInError'));
      }
      // 'cancelled': the user closed the popup, nothing to do.
    } catch (error) {
      console.error('Sign-in failed:', error);
      toast.error(t('signInError'));
    } finally {
      setIsPending(false);
    }
  };

  return { start, isPending };
}
