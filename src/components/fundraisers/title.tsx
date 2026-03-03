'use client';

import { cn } from '@/lib/utils';
import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

export function Title() {
  const t = useTranslations('Fundraisers.create.title');

  return (
    <TitleInput
      label={t('label')}
      placeholder={t('placeholder')}
      requiredMessage={t('errors.required')}
    />
  );
}

interface TitleInputProps {
  label: string;
  placeholder: string;
  requiredMessage: string;
}

function TitleInput({ label, placeholder, requiredMessage }: TitleInputProps) {
  const inputId = 'form-title';
  const errorId = `${inputId}-error`;

  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext<CreateFundraiserFormValues>();

  const hasTitleError = Boolean(touchedFields.title && errors.title);

  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor={inputId} className='sr-only'>
        {label}
      </label>
      <input
        id={inputId}
        type='text'
        placeholder={placeholder}
        className={cn(
          'typo-form-title-input bg-transparent outline-none w-full',
          hasTitleError && 'border-b border-red-500'
        )}
        aria-invalid={hasTitleError}
        aria-describedby={hasTitleError ? errorId : undefined}
        {...register('title')}
      />

      {hasTitleError && (
        <p id={errorId} className='text-sm text-red-600 dark:text-red-400'>
          {requiredMessage}
        </p>
      )}
    </div>
  );
}
