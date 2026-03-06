'use client';

import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { ALLOWED_COUNTRIES } from '@/lib/utils/country-currency';

const DevTool =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@hookform/devtools').then(m => m.DevTool), {
        ssr: false,
      })
    : null;

export const createFundraiserFormSchema = z.object({
  title: z.string().trim().min(1).max(50),
  country: z.enum(ALLOWED_COUNTRIES),
  settings: z.object({
    theme: z.object({
      base_id: z.string(),
      mode: z.enum(['light', 'dark']),
      accent: z.string(),
      background: z.string(),
      body_font: z.string(),
      title_font: z.string(),
      animation: z.string(),
    }),
  }),
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
  const pathname = usePathname();
  const initialTheme = getThemeForPath(pathname);

  const methods = useForm<CreateFundraiserFormValues>({
    resolver: zodResolver(createFundraiserFormSchema),
    defaultValues: {
      title: '',
      country: 'DE',
      settings: {
        theme: {
          base_id: initialTheme.id,
          mode: initialTheme.mode,
          accent: initialTheme.accent,
          background: initialTheme.background,
          body_font: initialTheme.bodyFont,
          title_font: initialTheme.titleFont,
          animation: initialTheme.animation ?? 'none',
        },
      },
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

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
