'use client';

import { Button } from '@/components/ui/button';
import { getSignInPageUrl } from '@/lib/auth/sign-in-redirect';
import { useTranslations } from 'next-intl';

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
  const tAuth = useTranslations('auth');
  const handleLogin = () => {
    const url = getSignInPageUrl(redirectTo);
    window.location.assign(url);
  };

  return (
    <Button onClick={handleLogin} variant={variant} size={size}>
      {tAuth('signIn')}
    </Button>
  );
}
