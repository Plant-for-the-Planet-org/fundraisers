'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { openSignInModal } from '@/stores/sign-in-modal-store';
import { AuthenticatedUserView } from './authenticated-user-view';
import { useDonationForm } from './donation-form-context';
import { GuestUserView } from './guest-user-view';

export function DonorInfo() {
  const tDonate = useTranslations('Donate');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const { hasPaymentInput } = useDonationForm();
  const isValidProfile = useAuthStore(
    state => state.user?.profile?.firstname && state.user?.profile?.lastname
  );

  const openSignIn = () => {
    openSignInModal(window.location.pathname + window.location.search);
  };

  return (
    <div className='donor-info flex flex-col gap-4'>
      <div className='flex items-baseline justify-between gap-4'>
        <h2 className='text-gray-900 text-lg font-semibold'>
          {tDonate('yourInfo')}
        </h2>
        {/* Signing in swaps the donor details for the account's. Once card or IBAN entry has started the nudge is no longer worth that swap. */}
        {!isAuthenticated && !isAuthInitializing && !hasPaymentInput && (
          <p className='text-sm text-muted-foreground text-right'>
            {tDonate.rich('signInNudge', {
              signInLink: chunks => (
                <button
                  type='button'
                  onClick={openSignIn}
                  className='font-medium text-accent-color hover:underline'
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
        )}
      </div>

      {isAuthenticated && isValidProfile ? (
        <AuthenticatedUserView />
      ) : (
        <GuestUserView />
      )}
    </div>
  );
}
