'use client';

import { AppleIcon } from 'lucide-react';
import { FacebookIcon, GoogleIcon } from '../icons/social';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { SignInWithButton } from '@/components/auth/sign-in-with-button';
import { SignUpButton } from './sign-up-button';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { buildSocialAuthorizeUrl } from '@/lib/auth/auth0-config';

export function SignInFormPanel() {
  const tAuth = useTranslations('Auth');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dash';
  const [email, setEmail] = useState('');

  const socialProviders = [
    {
      icon: <GoogleIcon />,
      label: tAuth('continueWithGoogle'),
      provider: 'google-oauth2',
    },
    {
      icon: <FacebookIcon />,
      label: tAuth('continueWithFacebook'),
      provider: 'facebook',
    },
    {
      icon: <AppleIcon />,
      label: tAuth('continueWithApple'),
      provider: 'apple',
    },
  ];

  const handleSocialLogin = async (provider: string) => {
    try {
      const authorizeUrl = await buildSocialAuthorizeUrl(
        provider, // connection name in Auth0
        redirectTo
      );

      window.location.assign(authorizeUrl); // redirect to Auth0
    } catch (error) {
      console.error('Social login failed:', error);
    }
  };

  return (
    <section className='flex-1 flex items-center justify-center px-6 py-12 lg:px-12 order-1 lg:order-2'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <h2 className='text-xl lg:text-2xl font-semibold'>
            {tAuth('title')}
          </h2>
          <p className='text-muted-foreground mt-2 text-sm lg:text-base'>
            {tAuth('subtitle')}
          </p>
        </div>
        <div className='space-y-4'>
          {/* Email input form - Primary option */}
          <EmailSignInForm
            email={email}
            setEmail={setEmail}
            redirectTo={redirectTo}
          />
          <p className='text-center text-sm text-muted-foreground mt-4'>
            {tAuth.rich('noAccount', {
              signUpLink: chunks => (
                <SignUpButton email={email} redirectTo={redirectTo}>
                  {chunks}
                </SignUpButton>
              ),
            })}
          </p>

          <div className='relative my-4'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>
                {tAuth('or')}
              </span>
            </div>
          </div>

          {socialProviders.map(({ icon, label, provider }) => (
            <SignInWithButton
              key={provider}
              icon={icon}
              label={label}
              onClick={() => handleSocialLogin(provider)}
            />
          ))}

          <p className='text-xs text-center text-muted-foreground mt-6'>
            {tAuth.rich('termsAgreement', {
              termsLink: chunks => (
                <a
                  href='https://www.plant-for-the-planet.org/terms-and-conditions/'
                  className='underline hover:text-primary'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {chunks}
                </a>
              ),
              privacyLink: chunks => (
                <a
                  href='https://www.plant-for-the-planet.org/privacy-terms/'
                  className='underline hover:text-primary'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
