'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { AuthenticatedUserView } from './authenticated-user-view';
import { GuestUserView } from './guest-user-view';

export function DonorInfo() {
  const tDonate = useTranslations('Donate');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isValidProfile = useAuthStore(
    state => state.user?.profile?.firstname && state.user?.profile?.lastname
  );

  return (
    <div className='donor-info flex flex-col gap-4'>
      <h2 className='text-gray-900 text-lg font-semibold'>
        {tDonate('yourInfo')}
      </h2>

      {isAuthenticated && isValidProfile ? (
        <AuthenticatedUserView />
      ) : (
        <GuestUserView />
      )}
    </div>
  );
}
