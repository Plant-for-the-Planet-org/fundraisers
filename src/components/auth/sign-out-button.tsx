'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { ArrowRightFromBracketIcon } from '@/components/ui/ui-icons';

export function SignOutButton() {
  const tAuth = useTranslations('Auth');
  const signOut = useAuthStore(state => state.logout);

  return (
    <Button
      onClick={() => signOut()}
      variant='ghost'
      size='sm'
      className='w-full justify-start hover:bg-gray-100 cursor-pointer'
    >
      <ArrowRightFromBracketIcon className='mr-2 h-4 w-4' />
      {tAuth('signOut')}
    </Button>
  );
}
