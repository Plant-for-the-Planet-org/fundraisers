'use client';

import type { Control } from 'react-hook-form';
import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { createDefaultCause } from '@/lib/utils/project-selection';
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

const unsplashAttributionSchema = z.object({
  photographer: z.string(),
  photographerUrl: z.string(),
  unsplashUrl: z.string(),
});

const selectedImageSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  originalUrl: z.string().optional(),
  attribution: unsplashAttributionSchema.optional(),
  source: z.enum(['unsplash', 'upload']),
  uploadStatus: z.enum(['pending', 'uploading', 'completed', 'failed']),
  downloadLocation: z.string().optional(),
  file: z.unknown().optional(),
});

const selectedCauseProjectSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  image: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const createFundraiserFormSchema = z.object({
  title: z.string().trim().min(1).max(50),
  description: z
    .string()
    .refine(value => getRichTextTextContent(value).length > 0),
  image: selectedImageSchema.nullable(),
  country: z.enum(ALLOWED_COUNTRIES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  goalAmount: z.number({ error: 'required' }).int().min(1, 'required'),
  visibility: z.enum(['public', 'unlisted']),
  status: z.enum(['draft', 'active']),
  projects: z.array(selectedCauseProjectSchema).min(1, 'required'),
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
  const t = useTranslations('Fundraisers.create.projectSelection');
  const pathname = usePathname();
  const initialTheme = getThemeForPath(pathname);
  const defaultCountry = 'DE';

  const methods = useForm<CreateFundraiserFormValues>({
    resolver: zodResolver(createFundraiserFormSchema),
    defaultValues: {
      title: '',
      description: '',
      image: null,
      country: defaultCountry,
      currency: getCurrencyForCountry(defaultCountry),
      goalAmount: 5000,
      visibility: 'public',
      status: 'draft',
      projects: [
        createDefaultCause(defaultCountry, [], {
          name: t('defaultCause.name'),
          description: t('defaultCause.description'),
        }),
      ],
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
