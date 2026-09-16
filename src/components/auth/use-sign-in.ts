'use client';

import type { SignInRequest } from '@/lib/auth/start-sign-in';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { signInWithPopup } from '@/lib/auth/start-sign-in';
import { getSafeRedirectPath } from '@/lib/utils/auth';

interface UseSignInOptions {
  /** Same-tab path with query to land on after sign-in. Unsafe paths fall back to the default. */
  returnTo: string | null;
  /** Runs after a successful popup sign-in. The redirect flow never gets here, the tab has left by then. */
  onSignedIn?: () => void;
  /** Ask Auth0 for credentials even though a session exists. Set when switching accounts. */
  forceLogin?: boolean;
}

/**
 * Shared start logic for the sign-in modal and the /login page.
 * Auth0 runs in a popup so the current page keeps its state. On phones the popup is a new tab, which works the same way: it posts the code back and closes itself. Only a blocked window falls back to the redirect flow.
 */
export function useSignIn({
  returnTo,
  onSignedIn,
  forceLogin = false,
}: UseSignInOptions) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const start = async (request: SignInRequest) => {
    if (isPending) return;
    setIsPending(true);

    const redirectTo = getSafeRedirectPath(returnTo);

    try {
      const outcome = await signInWithPopup(request, redirectTo, {
        forceLogin,
      });

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
