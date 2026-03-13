'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { RedirectPath } from '@/lib/types/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildUniversalLoginAuthorizeUrl } from '@/lib/auth/auth0-config';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface EmailSignInFormProps {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  redirectTo: RedirectPath;
}

export function EmailSignInForm({
  email,
  setEmail,
  redirectTo,
}: EmailSignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const tAuth = useTranslations('Auth');
  const continueLabel = tAuth('continueButton');

  const handleEmailSignIn = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!email.trim()) return;
    try {
      const authorizeUrl = await buildUniversalLoginAuthorizeUrl(
        redirectTo,
        email
      );
      window.location.assign(authorizeUrl);
    } catch (error) {
      console.error('Error generating login URL:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form className='space-y-4' onSubmit={handleEmailSignIn}>
      <div className='space-y-2'>
        <Label htmlFor='email' className='text-sm font-medium'>
          {tAuth('emailLabel')}
        </Label>
        <Input
          id='email'
          type='email'
          placeholder={tAuth('emailPlaceholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className='h-12'
        />
      </div>
      <Button
        type='submit'
        className='w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white'
        size='lg'
      >
        {continueLabel}
        {isLoading && '...'}
      </Button>
    </form>
  );
}
