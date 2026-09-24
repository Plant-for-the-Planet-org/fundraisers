'use client';

import type { SignInRequest } from '@/lib/auth/start-sign-in';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppleIcon, FacebookIcon, GoogleIcon } from '../icons/social';

interface SectionProps {
  start: (request: SignInRequest) => void;
  isPending: boolean;
}

/** Email field, continue button and the sign-up link. Used by the modal and the /login page. */
export function EmailSignInSection({ start, isPending }: SectionProps) {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    start({ method: 'email', email: trimmed });
  };

  return (
    <div className='space-y-4'>
      <form className='space-y-3' onSubmit={handleSubmit}>
        <div className='space-y-2'>
          <Label htmlFor='sign-in-email' className='text-sm font-medium'>
            {t('emailLabel')}
          </Label>
          <Input
            id='sign-in-email'
            type='email'
            autoComplete='email'
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={event => setEmail(event.target.value)}
            disabled={isPending}
            required
            className='h-11'
          />
        </div>
        <Button
          type='submit'
          size='lg'
          disabled={isPending}
          className='w-full h-11 bg-accent-color text-[var(--cta-foreground,#fff)] hover:bg-accent-color hover:opacity-90'
        >
          {t('form.continueWithEmail')}
        </Button>
      </form>

      <p className='text-center text-sm text-muted-foreground'>
        {t.rich('noAccount', {
          signUpLink: chunks => (
            <button
              type='button'
              disabled={isPending}
              onClick={() => start({ method: 'signup', email: email.trim() })}
              className='font-medium text-accent-color hover:underline'
            >
              {chunks}
            </button>
          ),
        })}
      </p>
    </div>
  );
}

const SOCIAL_PROVIDERS = [
  { connection: 'google-oauth2', name: 'Google', icon: <GoogleIcon /> },
  { connection: 'facebook', name: 'Facebook', icon: <FacebookIcon /> },
  { connection: 'apple', name: 'Apple', icon: <AppleIcon /> },
] as const;

export function SocialSignInButtons({
  start,
  isPending,
  className,
}: SectionProps & { className?: string }) {
  const t = useTranslations('Auth');

  return (
    <div className={cn('space-y-2', className)}>
      {SOCIAL_PROVIDERS.map(({ connection, name, icon }) => (
        <Button
          key={connection}
          type='button'
          variant='outline'
          disabled={isPending}
          onClick={() => start({ method: 'social', connection })}
          className='w-full h-11 border-border bg-background shadow-xs hover:bg-accent [&_svg]:mr-0'
        >
          {icon}
          {t(`continueWith${name}`)}
        </Button>
      ))}
    </div>
  );
}
