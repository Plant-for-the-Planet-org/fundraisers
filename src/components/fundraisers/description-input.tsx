'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { DESCRIPTION_MAX_LENGTH } from '@/lib/constants/fundraiser-creation';
import { cn } from '@/lib/utils';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { CharCount } from '@/components/fundraisers/char-count';
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

  const descriptionValue = useWatch({ control, name: 'description' }) ?? '';
  const textLength = getRichTextTextContent(descriptionValue).length;

  const isTooLong = textLength > DESCRIPTION_MAX_LENGTH;
  const hasDescriptionError = Boolean(
    (touchedFields.description || isSubmitted) && errors.description
  );

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>

      <div className='relative'>
        <Controller
          name='description'
          control={control}
          render={({ field }) => (
            <RichTextEditor
              className={cn(
                hasDescriptionError && 'border-b border-destructive'
              )}
              editableAreaClassName='pr-10'
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
        <div className='pointer-events-none absolute bottom-2 right-3'>
          <CharCount current={textLength} max={DESCRIPTION_MAX_LENGTH} />
        </div>
      </div>

      <p id={errorId} className='text-sm h-5 text-destructive'>
        {hasDescriptionError
          ? isTooLong
            ? t('errors.tooLong', { max: String(DESCRIPTION_MAX_LENGTH) })
            : t('errors.required')
          : ''}
      </p>
    </div>
  );
}
