'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';
import {
  EmailSignInSection,
  SocialSignInButtons,
} from '@/components/auth/sign-in-form-sections';
import { useSignIn } from '@/components/auth/use-sign-in';

interface SignInCardProps {
  /** Same-tab path with query to land on after sign-in. */
  returnTo: string | null;
  onSignedIn: () => void;
  /** Title and subtitle. The modal passes Radix DialogTitle and DialogDescription, the page plain headings. */
  header: ReactNode;
  /** `dialog` has padded sections and a muted footer. `plain` sits directly on the page background. */
  variant?: 'dialog' | 'plain';
  /** Ask Auth0 for credentials even though a session exists. The modal sets this when switching accounts. */
  forceLogin?: boolean;
}

/** The one sign-in form. Rendered inside the dialog on fundraiser pages and next to the picture on /login. */
export function SignInCard({
  returnTo,
  onSignedIn,
  header,
  variant = 'dialog',
  forceLogin = false,
}: SignInCardProps) {
  const { start, isPending } = useSignIn({ returnTo, onSignedIn, forceLogin });
  const isDialog = variant === 'dialog';

  return (
    <>
      <div className={cn('space-y-5', isDialog && 'p-6')}>
        {header}
        <EmailSignInSection start={start} isPending={isPending} />
      </div>
      <div
        className={cn(
          'border-t',
          isDialog ? 'bg-muted/40 p-6' : 'mt-6 pt-6 border-border/60'
        )}
      >
        <SocialSignInButtons start={start} isPending={isPending} />
      </div>
    </>
  );
}
