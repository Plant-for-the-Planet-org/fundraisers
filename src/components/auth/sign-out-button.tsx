'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
      <LogOut className='mr-2 h-4 w-4' />
      {tAuth('signOut')}
    </Button>
  );
}
