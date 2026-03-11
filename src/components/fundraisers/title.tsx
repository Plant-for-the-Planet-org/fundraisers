'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { CreateFundraiserFormValues } from '@/components/fundraisers/create-fundraiser-form-context';
import { cn } from '@/lib/utils';

const TITLE_MAX_LENGTH = 50;

function resizeToContent(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

export function Title() {
  const t = useTranslations('Fundraisers.create.title');

  return (
    <TitleInput
      label={t('label')}
      placeholder={t('placeholder')}
      requiredMessage={t('errors.required')}
      maxLengthMessage={t('errors.maxLength', { max: TITLE_MAX_LENGTH })}
    />
  );
}

interface TitleInputProps {
  label: string;
  placeholder: string;
  requiredMessage: string;
  maxLengthMessage: string;
}

function TitleInput({
  label,
  placeholder,
  requiredMessage,
  maxLengthMessage,
}: TitleInputProps) {
  const inputId = 'form-title';
  const errorId = `${inputId}-error`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    control,
    register,
    formState: { errors, touchedFields },
  } = useFormContext<CreateFundraiserFormValues>();
  const titleValue = useWatch({ control, name: 'title' });

  const resizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    resizeToContent(element);
  }, []);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [titleValue, resizeTextarea]);

  const { ref: registerRef, ...titleField } = register('title');

  const hasTitleError = Boolean(touchedFields.title && errors.title);
  const titleErrorMessage =
    errors.title?.type === 'too_big' ? maxLengthMessage : requiredMessage;

  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor={inputId} className='sr-only'>
        {label}
      </label>
      <textarea
        id={inputId}
        rows={1}
        maxLength={TITLE_MAX_LENGTH} // Keeping this will restrict the content & Error would never appear.
        placeholder={placeholder}
        className={cn(
          'font-poppins typo-form-title-input border-b border-transparent bg-transparent outline-none w-full resize-none overflow-hidden',
          hasTitleError && 'border-b border-destructive'
        )}
        aria-invalid={hasTitleError}
        aria-describedby={hasTitleError ? errorId : undefined}
        onInput={event => {
          resizeTextarea(event.currentTarget);
        }}
        {...titleField}
        ref={element => {
          registerRef(element);
          textareaRef.current = element;
        }}
      />
      <p id={errorId} className='text-sm h-5 text-destructive'>
        {hasTitleError ? titleErrorMessage : ''}
      </p>
    </div>
  );
}
