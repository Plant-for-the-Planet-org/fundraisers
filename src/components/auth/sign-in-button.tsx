'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { Button } from '@/components/ui/button';

interface SignInButtonProps {
  redirectTo?: string;
}

export function SignInButton({ redirectTo }: SignInButtonProps) {
  const tAuth = useTranslations('Auth');
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push(getSignInPath(redirectTo))}
      className='text-xs border-border'
      variant='outline'
      size='sm'
    >
      {tAuth('signIn')}
    </Button>
  );
}
