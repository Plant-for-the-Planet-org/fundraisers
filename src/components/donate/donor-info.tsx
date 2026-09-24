'use client';

import { useTranslations } from 'next-intl';
import {
  isSignInOlderThan,
  RECENT_SIGN_IN_MAX_AGE_MS,
} from '@/lib/auth/auth-time';
import { getDisplayName } from '@/lib/utils/profile';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
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
  const profile = useAuthStore(state => state.user?.profile);
  const authTime = useAuthStore(state => state.authTime);
  const isImpersonating = useImpersonationStore(state => state.isActive);

  const currentPage = () => window.location.pathname + window.location.search;
  const openSignIn = () => openSignInModal(currentPage());
  const openSwitchAccount = () =>
    openSignInModal(currentPage(), 'switch-account');

  // A sign-in from minutes ago is almost always the right person. Hours later, on a shared device, it may not be. While impersonating the name shown is not the person at the keyboard.
  const showSwitchAccount =
    isAuthenticated &&
    !!profile &&
    !hasPaymentInput &&
    !isImpersonating &&
    isSignInOlderThan(authTime, RECENT_SIGN_IN_MAX_AGE_MS);

  return (
    <div className='donor-info flex flex-col gap-4'>
      {/* Stacks on phones so neither the heading nor the link wraps. Below lg the overlay's fixed close button sits over the right end of this row, so leave room for it. */}
      <div className='flex flex-col gap-1 pr-12 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 lg:pr-0'>
        <h2 className='text-gray-900 text-lg font-semibold'>
          {tDonate('yourInfo')}
        </h2>
        {/* Signing in swaps the donor details for the account's. Once card or IBAN entry has started the nudge is no longer worth that swap. */}
        {!isAuthenticated && !isAuthInitializing && !hasPaymentInput && (
          <p className='text-sm text-muted-foreground sm:text-right'>
            {tDonate.rich('signInNudge', {
              signInLink: chunks => (
                <button
                  type='button'
                  onClick={openSignIn}
                  className='font-medium text-accent-text hover:underline'
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
        )}
        {showSwitchAccount && (
          <p className='text-sm text-muted-foreground sm:text-right'>
            {tDonate.rich('notYou', {
              name: profile.firstname || getDisplayName(profile),
              switchLink: chunks => (
                <button
                  type='button'
                  onClick={openSwitchAccount}
                  className='font-medium text-accent-text hover:underline'
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
