'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSignInPath } from '@/lib/auth/sign-in-redirect';
import { Button } from '@/components/ui/button';

export function SignInButton() {
  const tAuth = useTranslations('Auth');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const currentPath = search ? `${pathname}?${search}` : pathname;

  return (
    <Button
      onClick={() => router.push(getSignInPath(currentPath))}
      className='text-xs border-border'
      variant='outline'
      size='sm'
    >
      {tAuth('signIn')}
    </Button>
  );
}
