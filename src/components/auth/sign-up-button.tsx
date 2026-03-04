'use client';

import { buildSignupAuthorizeUrl } from '@/lib/auth/auth0-config';

interface SignUpButtonProps {
  children: React.ReactNode;
  redirectTo?: string;
  email: string;
}

export function SignUpButton({
  children,
  redirectTo,
  email,
}: SignUpButtonProps) {
  const handleSignUp = async () => {
    try {
      const authorizeUrl = await buildSignupAuthorizeUrl(redirectTo, email);
      window.location.assign(authorizeUrl);
    } catch (error) {
      console.error('Error generating signup URL:', error);
    }
  };

  return (
    <button
      className='font-medium text-primary hover:underline'
      onClick={handleSignUp}
      type='button'
    >
      {children}
    </button>
  );
}
