'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const TITLE_MAX_LENGTH = 50;

function resizeToContent(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

export function Title() {
  const t = useTranslations('Fundraisers.form.title');

  return (
    <TitleInput
      label={t('label')}
      placeholder={t('placeholder')}
      helper={t('helper')}
      requiredMessage={t('errors.required')}
      maxLengthMessage={t('errors.maxLength', { max: TITLE_MAX_LENGTH })}
    />
  );
}

interface TitleInputProps {
  label: string;
  placeholder: string;
  helper: string;
  requiredMessage: string;
  maxLengthMessage: string;
}

function TitleInput({
  label,
  placeholder,
  helper,
  requiredMessage,
  maxLengthMessage,
}: TitleInputProps) {
  const inputId = 'form-title';
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    control,
    register,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<FundraiserFormValues>();
  const titleValue = useWatch({ control, name: 'title' });

  useEffect(() => {
    resizeToContent(textareaRef.current);
  }, [titleValue]);

  const { ref: registerRef, ...titleField } = register('title');

  const hasTitleError = Boolean(
    (touchedFields.title || isSubmitted) && errors.title
  );
  const titleErrorMessage =
    errors.title?.type === 'too_big' ? maxLengthMessage : requiredMessage;

  const count = titleValue?.length ?? 0;

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-baseline justify-between gap-2'>
        <label
          htmlFor={inputId}
          className='text-sm font-medium'
          style={{ fontFamily: 'var(--theme-title-font)' }}
        >
          {label}
          <span aria-hidden='true' className='text-destructive ml-0.5'>
            *
          </span>
        </label>
        <span
          aria-live='polite'
          className={cn(
            'text-xs tabular-nums text-muted-foreground',
            count >= TITLE_MAX_LENGTH && 'text-destructive'
          )}
        >
          {count} / {TITLE_MAX_LENGTH}
        </span>
      </div>
      <Textarea
        id={inputId}
        rows={1}
        maxLength={TITLE_MAX_LENGTH} // Keeping this will restrict the content & Error would never appear.
        placeholder={placeholder}
        style={{ fontFamily: 'var(--theme-title-font)' }}
        className={cn(
          'text-4xl font-bold wrap-anywhere',
          'rounded-none border-0 border-b border-transparent px-0 py-0 shadow-none overflow-hidden',
          'focus-visible:ring-0 focus-visible:border-transparent',
          'aria-invalid:ring-0 aria-invalid:border-b-destructive',
          hasTitleError && 'border-b-destructive'
        )}
        aria-invalid={hasTitleError}
        aria-describedby={hasTitleError ? `${errorId} ${helperId}` : helperId}
        onInput={event => {
          resizeToContent(event.currentTarget);
        }}
        {...titleField}
        ref={element => {
          registerRef(element);
          textareaRef.current = element;
        }}
      />
      {hasTitleError ? (
        <p id={errorId} className='text-sm text-destructive'>
          {titleErrorMessage}
        </p>
      ) : (
        <p id={helperId} className='text-xs text-muted-foreground'>
          {helper}
        </p>
      )}
    </div>
  );
}
