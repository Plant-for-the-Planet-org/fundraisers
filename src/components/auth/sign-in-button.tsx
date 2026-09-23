'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { openSignInModal } from '@/stores/sign-in-modal-store';
import { Button } from '@/components/ui/button';

export function SignInButton() {
  const tAuth = useTranslations('Auth');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const currentPath = search ? `${pathname}?${search}` : pathname;

  return (
    <Button
      onClick={() => openSignInModal(currentPath)}
      className='text-xs border-border'
      variant='outline'
      size='sm'
    >
      {tAuth('signIn')}
    </Button>
  );
}
