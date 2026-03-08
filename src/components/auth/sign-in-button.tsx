'use client';

import { Button } from '@/components/ui/button';
import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface SignInButtonProps {
  redirectTo?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function SignInButton({
  redirectTo,
  variant = 'default',
  size = 'default',
}: SignInButtonProps) {
  const tAuth = useTranslations('Auth');
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push(getSignInPath(redirectTo))}
      variant={variant}
      size={size}
    >
      {tAuth('signIn')}
    </Button>
  );
}
