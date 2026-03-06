'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';

import type { CreateFundraiserFormValues } from '@/components/fundraisers/create-fundraiser-form-context';
import { SectionHeader } from '@/components/fundraisers/typography';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';

export function Description() {
  const t = useTranslations('Fundraisers.create.description');
  const descriptionId = 'form-description';
  const errorId = `${descriptionId}-error`;

  const {
    control,
    formState: { errors, touchedFields },
  } = useFormContext<CreateFundraiserFormValues>();

  const hasDescriptionError = Boolean(
    touchedFields.description && errors.description
  );

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>

      <Controller
        name='description'
        control={control}
        render={({ field }) => (
          <RichTextEditor
            className={cn(hasDescriptionError && 'border-b border-red-500')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('placeholder')}
            aria-label={t('label')}
            ariaInvalid={hasDescriptionError}
            ariaDescribedBy={hasDescriptionError ? errorId : undefined}
          />
        )}
      />

      <p id={errorId} className='text-sm h-5 text-red-600 dark:text-red-400'>
        {hasDescriptionError ? t('errors.required') : ''}
      </p>
    </div>
  );
}
