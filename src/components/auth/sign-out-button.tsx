'use client';

import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

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
