'use client';

import type { DropdownProps, Matcher } from 'react-day-picker';
import type { EndDateBounds } from '@/lib/constants/fundraiser-creation';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { Dropdown } from 'react-day-picker';
import { de, enUS } from 'react-day-picker/locale';
import { useController } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { getEndDateBounds } from '@/lib/constants/fundraiser-creation';
import {
  formatDateInput,
  formatDateInputLocalized,
  getLocaleDatePlaceholder,
  parseDateInput,
  parseLocalizedDateInput,
} from '@/lib/utils/date';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EndDateInputProps {
  /** Allowed date range for the date picker. */
  bounds?: EndDateBounds;

  /** Current fundraiser end date used in validation messages. */
  currentEndDate?: string;

  /**
   * Controls the "too early" validation message.
   * Use 'after' when the date must be later than the minimum date,
   * or 'onOrAfter' when the minimum date is allowed.
   */
  minDateMessage?: 'after' | 'onOrAfter';

  /** Optional helper text shown when there is no validation error. */
  helperText?: string;
}

export function EndDateInput({
  bounds: boundsProp,
  currentEndDate,
  minDateMessage = 'after',
  helperText,
}: EndDateInputProps = {}) {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.form.endDate');
  const {
    field: { value, onChange, onBlur, name, ref },
    fieldState,
  } = useController<FundraiserFormValues, 'endDate'>({
    name: 'endDate',
  });

  const [open, setOpen] = useState(false);
  // Raw input buffer. The form stores YYYY-MM-DD, but while editing we keep the
  // user's text unchanged so partial input isn't reformatted.
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // The form stores YYYY-MM-DD; treat a missing value as an empty string.
  const storedValue = value ?? '';

  // Show the localized date, falling back to the stored value so invalid input
  // remains visible.
  const toDisplayValue = (dateString: string) =>
    formatDateInputLocalized(dateString, locale) || dateString;

  // Show raw input while editing; otherwise the localized stored value.
  const displayText = isEditing ? text : toDisplayValue(storedValue);

  // Allowed end date range used by both validation and the date picker.
  const bounds = boundsProp ?? getEndDateBounds();
  const minDate = parseDateInput(bounds.min);
  const maxDate = parseDateInput(bounds.max);

  // The calendar works with Date objects; the field stores YYYY-MM-DD.
  const selectedDate = parseDateInput(storedValue);

  // Match the calendar's month names and first day of week to the app locale.
  const calendarLocale = locale.startsWith('de') ? de : enUS;

  // Format dates in a clear, localized format for validation messages.
  const formatLong = (dateString: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
      new Date(`${dateString}T00:00:00`)
    );

  const errorId = 'form-end-date-error';
  const helperId = 'form-end-date-helper';

  const errorCode = fieldState.error?.message;

  // The "too early" message varies: relative to the current end date when
  // extending, otherwise inclusive or exclusive of the minimum date.
  const resolveMinDateMessage = () => {
    if (currentEndDate) {
      return t('errors.afterCurrentEndDate', {
        date: formatLong(currentEndDate),
      });
    }
    if (minDateMessage === 'onOrAfter') {
      return t('errors.onOrAfterMinDate', { date: formatLong(bounds.min) });
    }
    return t('errors.minDate', { date: formatLong(bounds.min) });
  };

  // Map the active validation code to a translated message.
  const resolveErrorMessage = (): string | null => {
    if (!errorCode) return null;
    if (errorCode === 'invalid') return t('errors.invalid');
    if (errorCode === 'minDate') return resolveMinDateMessage();
    if (errorCode === 'maxDate') {
      return t('errors.maxDate', { date: formatLong(bounds.max) });
    }
    return t('errors.required');
  };
  const errorMessage = resolveErrorMessage();

  // Error takes precedence: the field shows the error or the helper, never both.
  const showHelper = !errorMessage && Boolean(helperText);
  const describedBy = errorMessage
    ? errorId
    : showHelper
      ? helperId
      : undefined;

  // Keep the calendar navigable only within the allowed range.
  const disabledDays: Matcher[] = [];
  if (minDate) disabledDays.push({ before: minDate });
  if (maxDate) disabledDays.push({ after: maxDate });

  const handleTextChange = (raw: string) => {
    setText(raw);
    const parsed = parseLocalizedDateInput(raw, locale);
    // Commit valid dates and cleared input; ignore incomplete entries while typing.
    if (parsed !== null) onChange(parsed);
  };

  const handleFocus = () => {
    setText(toDisplayValue(storedValue));
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseLocalizedDateInput(text, locale);
    // Keep invalid input so validation can show an error.
    const next = parsed ?? text;
    // Avoid re-committing unchanged values, which can trigger validation on focus.
    if (next !== storedValue) {
      onChange(next);
    }
    onBlur();
  };

  const handleSelect = (date: Date | undefined) => {
    // Ignore deselection when the selected day is clicked again.
    if (!date) return;
    onChange(formatDateInput(date));
    // Validate immediately after selection.
    onBlur();
    setOpen(false);
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
      <Popover open={open} onOpenChange={setOpen}>
        {/* Anchor the calendar to the whole field, not just the button. */}
        <PopoverAnchor asChild>
          <div className='relative'>
            <Input
              id='form-end-date'
              type='text'
              inputMode='numeric'
              autoComplete='off'
              placeholder={getLocaleDatePlaceholder(locale)}
              aria-invalid={fieldState.invalid}
              aria-describedby={describedBy}
              className='h-11 border-border bg-transparent pr-10 hover:bg-muted/5 md:h-9'
              value={displayText}
              onChange={event => handleTextChange(event.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              name={name}
              ref={ref}
            />
            <PopoverTrigger asChild>
              <button
                type='button'
                aria-label={t('openCalendar')}
                className='absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]'
              >
                <CalendarDays className='size-4' aria-hidden='true' />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? minDate}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={disabledDays}
            captionLayout='dropdown'
            locale={calendarLocale}
            autoFocus
            // Increase calendar cell size without modifying calendar.tsx.
            style={
              {
                '--cell-size': 'calc(var(--spacing) * 9.2)',
              } as React.CSSProperties
            }
            // Remove the focus ring from the selected day.
            className='**:data-[selected-single=true]:ring-0!'
            // Use localized full month names in the dropdown
            formatters={{
              formatMonthDropdown: date =>
                new Intl.DateTimeFormat(locale, { month: 'long' }).format(date),
            }}
            // Hide months outside the allowed range.
            components={{
              MonthsDropdown: ({ options, ...props }: DropdownProps) => (
                <Dropdown
                  options={options?.filter(option => !option.disabled)}
                  {...props}
                />
              ),
            }}
          />
        </PopoverContent>
      </Popover>
      {errorMessage ? (
        <p
          id={errorId}
          role='alert'
          aria-live='polite'
          className='text-sm text-destructive'
        >
          {errorMessage}
        </p>
      ) : showHelper ? (
        <p
          id={helperId}
          aria-live='polite'
          className='text-sm text-muted-foreground'
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
