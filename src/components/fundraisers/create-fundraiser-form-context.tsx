'use client';

import type { ReactNode } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getRichTextTextContent } from '@/lib/utils/rich-text';

export const createFundraiserFormSchema = z.object({
  title: z.string().trim().min(1),
  description: z
    .string()
    .refine(value => getRichTextTextContent(value).length > 0),
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
      description: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}
