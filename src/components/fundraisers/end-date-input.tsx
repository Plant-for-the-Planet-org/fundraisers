'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useRef } from 'react';
import { useController } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { getEndDateBounds } from '@/lib/constants/fundraiser-creation';
import { Input } from '@/components/ui/input';

export function EndDateInput() {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.form.endDate');
  const {
    field: { value, onChange, onBlur, name, ref },
    fieldState,
  } = useController<FundraiserFormValues, 'endDate'>({
    name: 'endDate',
  });

  // Allowed end date range used by both validation and the date picker.
  const bounds = getEndDateBounds();

  // Format dates in a clear, localized format for validation messages.
  const formatLong = (dateString: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
      new Date(`${dateString}T00:00:00`)
    );

  const errorId = 'form-end-date-error';
  // Only describe the input by the error node when one is actually rendered.
  const describedBy = fieldState.error ? errorId : undefined;

  // Map validation codes to translated error messages.
  const errorCode = fieldState.error?.message;
  let errorMessage: string | null = null;
  if (errorCode === 'invalid') {
    errorMessage = t('errors.invalid');
  } else if (errorCode === 'minDate') {
    errorMessage = t('errors.minDate', { date: formatLong(bounds.min) });
  } else if (errorCode === 'maxDate') {
    errorMessage = t('errors.maxDate', { date: formatLong(bounds.max) });
  } else if (errorCode) {
    errorMessage = t('errors.required');
  }

  // Store the input ref so the calendar button can open the native date picker..
  const inputRef = useRef<HTMLInputElement>(null);
  const setInputRef = (element: HTMLInputElement | null) => {
    ref(element);
    inputRef.current = element;
  };

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    // Open the native date picker from the calendar button.
    // If unsupported, focus the input for manual entry.
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  return (
    <div className='end-date-input flex flex-col gap-2'>
      <label
        className='text-sm font-medium'
        htmlFor='form-end-date'
        style={{ fontFamily: 'var(--theme-title-font)' }}
      >
        {t('label')}
      </label>
      <div className='relative'>
        <Input
          id='form-end-date'
          type='date'
          min={bounds.min}
          max={bounds.max}
          autoComplete='off'
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
          // Hide the native picker icon and use the calendar button as the picker trigger.
          className='h-11 border-border bg-transparent pr-10 hover:bg-muted/5 md:h-9 [&::-webkit-calendar-picker-indicator]:opacity-0'
          value={value ?? ''}
          onChange={event => onChange(event.target.value)}
          onBlur={onBlur}
          name={name}
          ref={setInputRef}
        />
        <button
          type='button'
          onClick={openPicker}
          aria-label={t('openCalendar')}
          className='absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]'
        >
          <CalendarDays className='size-4' aria-hidden='true' />
        </button>
      </div>
      {errorMessage && (
        <p
          id={errorId}
          role='alert'
          aria-live='polite'
          className='text-sm text-destructive'
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
