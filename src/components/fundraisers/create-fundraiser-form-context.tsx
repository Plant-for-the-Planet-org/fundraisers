'use client';

import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getThemeForPath } from '@/lib/theme/route-themes';
import {
  ALLOWED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  getCurrencyForCountry,
} from '@/lib/utils/country-currency';
import { getRichTextTextContent } from '@/lib/utils/rich-text';

const DevTool =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@hookform/devtools').then(m => m.DevTool), {
        ssr: false,
      })
    : null;

import type { SelectedImage } from '@/lib/types/image-selection';

const selectedImageSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  originalUrl: z.string().optional(),
  attribution: z
    .object({
      photographer: z.string().min(1),
      photographerUrl: z.string().min(1),
      unsplashUrl: z.string().min(1),
    })
    .optional(),
  source: z.enum(['unsplash', 'upload']),
  uploadStatus: z.enum(['pending', 'uploading', 'completed', 'failed']),
  downloadLocation: z.string().optional(),
  file: z
    .custom<File | undefined>(value => {
      if (value === undefined) {
        return true;
      }
      return typeof File !== 'undefined' && value instanceof File;
    })
    .optional(),
});

export const createFundraiserFormSchema = z.object({
  title: z.string().trim().min(1).max(50),
  description: z
    .string()
    .refine(value => getRichTextTextContent(value).length > 0),
  country: z.enum(ALLOWED_COUNTRIES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  goalAmount: z.number({ error: 'required' }).int().min(1, 'required'),
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
  image: selectedImageSchema.nullable(),
});

export type CreateFundraiserFormValues = z.infer<
  typeof createFundraiserFormSchema
> & { image: SelectedImage | null };

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
      description: '',
      country: 'DE',
      currency: getCurrencyForCountry('DE'),
      goalAmount: 5000,
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
      title: '',
      description: '',
      image: null,
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
