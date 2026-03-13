'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { getCurrencySymbol } from '@/lib/utils/currency';

export function GoalInput() {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.create.goal');
  const {
    field: { value, onChange, onBlur, name, ref },
    fieldState,
  } = useController<CreateFundraiserFormValues, 'goalAmount'>({
    name: 'goalAmount',
  });

  const currency = useWatch<CreateFundraiserFormValues, 'currency'>({
    name: 'currency',
  });
  const currencySymbol = getCurrencySymbol(currency);

  const [isFocused, setIsFocused] = useState(false);

  const formatValue = (v: number) => new Intl.NumberFormat(locale).format(v);

  let displayValue = '';
  if (value != null) {
    displayValue = isFocused ? String(value) : formatValue(value);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const parsed = digits === '' ? null : parseInt(digits, 10);
    onChange(parsed);
  };

  const describedBy = `form-goal-amount-currency${fieldState.error ? ' form-goal-amount-error' : ''}`;

  return (
    <div className='goal-input flex flex-col gap-2'>
      <label className='text-sm font-medium' htmlFor='form-goal-amount'>
        {t('label')}
      </label>
      <div className='relative'>
        <Input
          id='form-goal-amount'
          type='text'
          inputMode='numeric'
          autoComplete='off'
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
          className='bg-transparent border-border hover:bg-muted/5 pr-12'
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur();
          }}
          name={name}
          ref={ref}
        />
        <span
          className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground'
          aria-hidden='true'
        >
          {currencySymbol}
        </span>
      </div>
      <span id='form-goal-amount-currency' className='sr-only'>
        {currency}
      </span>
      {fieldState.error && (
        <p id='form-goal-amount-error' className='text-sm text-destructive'>
          {t('errors.required')}
        </p>
      )}
    </div>
  );
}
