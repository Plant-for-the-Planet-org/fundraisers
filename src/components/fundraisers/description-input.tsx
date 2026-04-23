'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/fundraisers/typography';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export default function DescriptionInput() {
  const t = useTranslations('Fundraisers.form.description');
  const descriptionId = 'form-description';
  const errorId = `${descriptionId}-error`;

  const {
    control,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<FundraiserFormValues>();

  const hasDescriptionError = Boolean(
    (touchedFields.description || isSubmitted) && errors.description
  );

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>

      <Controller
        name='description'
        control={control}
        render={({ field }) => (
          <RichTextEditor
            className={cn(hasDescriptionError && 'border-b border-destructive')}
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

      <p id={errorId} className='text-sm h-5 text-destructive'>
        {hasDescriptionError ? t('errors.required') : ''}
      </p>
    </div>
  );
}
