'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isAllowedRedirect } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useSignInModalStore } from '@/stores/sign-in-modal-store';
import { SignInCard } from '@/components/auth/sign-in-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Sign-in for the fundraiser page. Auth0 opens in a popup so the page underneath keeps its state.
 * Guarded routes and deep links still use /login, which shows the same card next to a picture.
 */
export function SignInModal() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const isOpen = useSignInModalStore(state => state.isOpen);
  const returnTo = useSignInModalStore(state => state.returnTo);
  const mode = useSignInModalStore(state => state.mode);
  const close = useSignInModalStore(state => state.close);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSwitching = mode === 'switch-account';

  // Someone switching accounts is signed in the whole time, so only the plain sign-in closes on auth.
  useEffect(() => {
    if (isOpen && isAuthenticated && !isSwitching) close();
  }, [isOpen, isAuthenticated, isSwitching, close]);

  const handleSignedIn = () => {
    close();
    // Most callers pass the page they are on, so this is a no-op. The host-invite bar adds `intent=accept` so its effect resumes.
    const current = window.location.pathname + window.location.search;
    if (returnTo && returnTo !== current && isAllowedRedirect(returnTo)) {
      router.replace(returnTo);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && close()}>
      <DialogContent className='sm:max-w-sm gap-0 p-0 overflow-hidden'>
        <SignInCard
          returnTo={returnTo}
          onSignedIn={handleSignedIn}
          forceLogin={isSwitching}
          header={
            <DialogHeader className='text-left sm:text-left gap-1.5'>
              <DialogTitle className='text-xl'>{t('form.title')}</DialogTitle>
              <DialogDescription>{t('form.subtitle')}</DialogDescription>
            </DialogHeader>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
