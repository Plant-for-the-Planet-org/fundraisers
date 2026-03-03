'use client';

import type { ReactNode } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

export const createFundraiserFormSchema = z.object({
  title: z.string().trim().min(1).max(50),
});

export type CreateFundraiserFormValues = z.infer<
  typeof createFundraiserFormSchema
>;

interface CreateFundraiserFormProviderProps {
  children: ReactNode;
}

export function CreateFundraiserFormProvider({
  children,
}: CreateFundraiserFormProviderProps) {
  const methods = useForm<CreateFundraiserFormValues>({
    resolver: zodResolver(createFundraiserFormSchema),
    defaultValues: {
      title: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}
