'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SectionHeader } from './typography';

export function Description() {
  const t = useTranslations('Fundraisers.create.description');
  const descriptionId = useId();
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
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('placeholder')}
            ariaInvalid={hasDescriptionError}
            ariaDescribedBy={hasDescriptionError ? errorId : undefined}
          />
        )}
      />

      {hasDescriptionError && (
        <p id={errorId} className='text-sm text-red-600 dark:text-red-400'>
          {t('errors.required')}
        </p>
      )}
    </div>
  );
}
