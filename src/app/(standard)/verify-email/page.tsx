import type { Metadata } from 'next';

import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EMAIL_VERIFICATION_PENDING_COOKIE } from '@/lib/constants/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default async function VerifyEmailPage() {
  const cookieStore = await cookies();

  // Only users redirected here by the Auth0 callback (after an
  // email_not_verified denial) carry this cookie. Anyone else is sent to
  // login — where an already-authenticated user is bounced on to /explore.
  if (!cookieStore.get(EMAIL_VERIFICATION_PENDING_COOKIE)) {
    redirect('/login');
  }

  const tAuth = await getTranslations('Auth');

  return (
    <div className='flex items-center justify-center px-6 py-12'>
      <Card className='w-full max-w-md border-2 border-card shadow rounded-2xl text-center'>
        <CardHeader>
          <CardTitle className='text-xl lg:text-2xl'>
            {tAuth('verifyEmail.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm lg:text-base'>
            {tAuth('verifyEmail.description')}
          </p>
          <p className='text-muted-foreground text-sm lg:text-base'>
            {tAuth('verifyEmail.spamNote')}
          </p>
          <Button asChild className='w-full'>
            <Link href='/login'>{tAuth('verifyEmail.cta')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
