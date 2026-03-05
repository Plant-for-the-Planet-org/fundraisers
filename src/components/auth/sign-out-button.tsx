'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SignOutButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  children?: React.ReactNode;
}

export function SignOutButton({
  className,
  variant = 'ghost',
  size = 'default',
  children,
}: SignOutButtonProps) {
  const tAuth = useTranslations('Auth');
  const signOut = useAuthStore(state => state.logout);
  const handleSignOut = () => {
    signOut();
  };
  return (
    <Button
      onClick={handleSignOut}
      variant={variant}
      size={size}
      className={className}
    >
      {children || (
        <>
          <LogOut className='mr-2 h-4 w-4' />
          {tAuth('signOut')}
        </>
      )}
    </Button>
  );
}
