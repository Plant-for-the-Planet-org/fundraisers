'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { GOAL_AMOUNT_MIN } from '@/lib/constants/fundraiser-creation';
import {
  formatCurrencyFromDecimal,
  getCurrencySymbol,
} from '@/lib/utils/currency';
import { Input } from '@/components/ui/input';

export function GoalInput() {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.form.goal');
  const {
    field: { value, onChange, onBlur, name, ref },
    fieldState,
  } = useController<FundraiserFormValues, 'goalAmount'>({
    name: 'goalAmount',
  });

  const currency = useWatch<FundraiserFormValues, 'currency'>({
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
      <label
        className='text-sm font-medium'
        htmlFor='form-goal-amount'
        style={{ fontFamily: 'var(--theme-title-font)' }}
      >
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
          className='bg-base/20 dark:bg-white/10 border-border hover:bg-base/30 dark:hover:bg-white/15 pr-12'
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
          {fieldState.error.message === 'minAmount'
            ? t('errors.minAmount', {
                formattedAmount: formatCurrencyFromDecimal(
                  GOAL_AMOUNT_MIN,
                  currency,
                  locale
                ),
              })
            : t('errors.required')}
        </p>
      )}
    </div>
  );
}
