'use client';

import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';
import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  buildDefaultCreateValues,
  fundraiserFormSchema,
} from './fundraiser-form-schema';

export {
  fundraiserFormSchema as createFundraiserFormSchema,
  type FundraiserFormValues as CreateFundraiserFormValues,
} from './fundraiser-form-schema';

const DevTool =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@hookform/devtools').then(m => m.DevTool), {
        ssr: false,
      })
    : null;

interface CreateFundraiserFormProviderProps {
  children: ReactNode;
}

export function CreateFundraiserFormProvider({
  children,
}: CreateFundraiserFormProviderProps) {
  const pathname = usePathname();

  const methods = useForm<FundraiserFormValues>({
    resolver: zodResolver(fundraiserFormSchema),
    defaultValues: buildDefaultCreateValues(pathname),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    methods.register('image');
    methods.register('currency');
    methods.register('projectAllocations');
  }, [methods]);

  {
    /* TODO: wrap children in a <form> tag for accessibility (Enter key submission, screen reader semantics).
    Note: form must replicate FundraiserLayout's inner flex styles to avoid breaking layout. */
  }
  return (
    <FormProvider {...methods}>
      {children}
      {DevTool !== null && (
        <DevTool control={methods.control as unknown as Control} />
      )}
    </FormProvider>
  );
}
