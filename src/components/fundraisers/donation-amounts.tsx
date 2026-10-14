'use client';

import type { ContributionOption } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Pencil, X } from 'lucide-react';
import { DEFAULT_MIN_CENTS } from '@/lib/constants/donation';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';

/** Lets a host change the preset amounts right in the tiles, in the form's preview. The set stays the same size: amounts can be changed, never added or removed. */
export interface AmountEditor {
  /** What each tile shows, in whole currency units, as the host is typing it. */
  values: string[];
  /** The tile that is shown first. */
  selectedIndex: number;
  onSelect: (index: number) => void;
  onChange: (index: number, raw: string) => void;
  /** Called when a tile loses focus, to keep or drop what was typed. */
  onCommit: (index: number) => void;
}

interface DonationAmountsProps {
  amountEditor?: AmountEditor;
  amounts: number[];
  currency: string;
  onAmountSelect: (amount: number) => void;
  selectedAmount?: number;
  onCustomAmountChange: (amount: number | undefined) => void;
  customOption?: ContributionOption | null;
  minCents?: number;
}

export function DonationAmounts({
  amountEditor,
  amounts,
  currency,
  onAmountSelect,
  selectedAmount,
  onCustomAmountChange,
  customOption,
  minCents,
}: DonationAmountsProps) {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const locale = useLocale();
  const [isCustomInputSelected, setIsCustomInputSelected] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const effectiveMinCents = minCents ?? customOption?.min ?? DEFAULT_MIN_CENTS;

  const decimalSep =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find(p => p.type === 'decimal')?.value ?? '.';

  const parseLocalizedFloat = (raw: string) =>
    parseFloat(decimalSep === ',' ? raw.replace(',', '.') : raw);

  const showMinHint =
    isCustomInputSelected &&
    inputValue !== '' &&
    parseLocalizedFloat(inputValue) * 100 < effectiveMinCents;

  const symbol = getCurrencySymbol(currency);
  const currencyCode = currency.toUpperCase();
  const currencyLabel =
    symbol === currencyCode ? currencyCode : `${symbol} ${currencyCode}`;

  return (
    <div className='space-y-4'>
      {/* Preset amounts */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3.5'>
        {amountEditor &&
          amountEditor.values.map((value, index) => {
            const selected =
              amountEditor.selectedIndex === index && !isCustomInputSelected;
            return (
              <div
                key={index}
                onClick={() => {
                  amountEditor.onSelect(index);
                  setIsCustomInputSelected(false);
                  setInputValue('');
                  onCustomAmountChange(undefined);
                }}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 transition-all dark:bg-white/10',
                  selected
                    ? 'border-foreground dark:border-foreground'
                    : 'border-border/50 hover:border-border'
                )}
              >
                {/* Looks like a field, with a pencil, so it is clear the amount can be typed over. */}
                <label className='flex h-9 cursor-text items-center gap-2 rounded-md border border-input bg-background/70 px-3 text-base font-semibold text-foreground focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10 dark:bg-white/5'>
                  <span aria-hidden='true'>{symbol}</span>
                  <input
                    inputMode='numeric'
                    aria-label={t('settings.amountLabel', {
                      n: String(index + 1),
                    })}
                    value={value}
                    onClick={e => e.stopPropagation()}
                    onChange={e => amountEditor.onChange(index, e.target.value)}
                    onBlur={() => amountEditor.onCommit(index)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    className='min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold outline-none'
                  />
                  <Pencil
                    aria-hidden='true'
                    className='size-3.5 shrink-0 text-muted-foreground'
                  />
                </label>
                <button
                  type='button'
                  role='radio'
                  aria-checked={selected}
                  className={cn(
                    'flex items-center gap-2 text-left text-xs',
                    selected
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span
                    aria-hidden='true'
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border transition-all',
                      selected
                        ? 'border-foreground bg-foreground'
                        : 'border-input'
                    )}
                  >
                    {selected && <Check className='size-3 text-background' />}
                  </span>
                  {selected
                    ? t('settings.selectedFirst')
                    : t('settings.makeFirst')}
                </button>
              </div>
            );
          })}
        {!amountEditor &&
          amounts.map(amount => (
            <Button
              key={amount}
              variant='outline'
              onClick={() => {
                onAmountSelect(amount);
                setIsCustomInputSelected(false);
                setInputValue('');
              }}
              className={cn(
                'h-14 p-5 bg-card dark:bg-white/10 rounded-lg border border-border/50 flex items-center gap-3 transition-all justify-start',
                selectedAmount === amount && !isCustomInputSelected
                  ? 'border-foreground dark:border-foreground'
                  : 'hover:border-border'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-lg border transition-all flex items-center justify-center',
                  selectedAmount === amount && !isCustomInputSelected
                    ? 'bg-foreground border-foreground'
                    : 'border-input'
                )}
              >
                {selectedAmount === amount && !isCustomInputSelected && (
                  <Check className='w-3 h-3 text-background' />
                )}
              </div>
              <div className='text-foreground text-base font-semibold'>
                {formatCurrency(amount, currency, locale)}
              </div>
            </Button>
          ))}
      </div>

      {/* Custom amount - only show if custom option exists */}
      {customOption && (
        <div className='space-y-1.5'>
          <div
            className={cn(
              'h-12 px-5 py-6 bg-card dark:bg-white/5 rounded-lg border border-border/50 flex justify-between items-center cursor-pointer transition-all',
              isCustomInputSelected
                ? 'border-foreground dark:border-foreground'
                : 'hover:border-border'
            )}
            onClick={() => setIsCustomInputSelected(true)}
          >
            {isCustomInputSelected ? (
              <div className='flex items-center flex-1 gap-2'>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder={t('enterAmount')}
                  value={inputValue}
                  aria-describedby={
                    showMinHint ? 'custom-amount-min-hint' : undefined
                  }
                  onChange={e => {
                    let newValue = e.target.value;
                    const sepIdx = newValue.indexOf(decimalSep);
                    if (sepIdx !== -1 && newValue.length - sepIdx - 1 > 2) {
                      newValue = newValue.slice(0, sepIdx + 3);
                    }
                    setInputValue(newValue);

                    if (newValue === '' || newValue === decimalSep) {
                      onCustomAmountChange(undefined);
                    } else {
                      const displayValue = parseLocalizedFloat(newValue);
                      if (!isNaN(displayValue)) {
                        onCustomAmountChange(Math.round(displayValue * 100));
                      }
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setIsCustomInputSelected(false);
                      return;
                    }
                    if (
                      ['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key) ||
                      ((e.key === 'a' ||
                        e.key === 'c' ||
                        e.key === 'v' ||
                        e.key === 'x') &&
                        e.ctrlKey)
                    ) {
                      return;
                    }
                    const sepIdx = inputValue.indexOf(decimalSep);
                    if (sepIdx !== -1 && /^\d$/.test(e.key)) {
                      if (inputValue.length - sepIdx - 1 >= 2) {
                        e.preventDefault();
                        return;
                      }
                    }
                    if (!/^\d$/.test(e.key) && e.key !== decimalSep) {
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => {
                    if (!inputValue) setIsCustomInputSelected(false);
                  }}
                  className='flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground text-base font-semibold p-0 h-auto shadow-none'
                  autoFocus
                />
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setInputValue('');
                    onCustomAmountChange(undefined);
                    setIsCustomInputSelected(false);
                  }}
                  className='text-muted-foreground hover:text-foreground transition-colors'
                  type='button'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ) : (
              <div className='text-muted-foreground text-base font-normal'>
                {t('customAmount')}
              </div>
            )}
            <div className='flex items-center gap-1 text-foreground font-bold pointer-events-none'>
              {currencyLabel}
            </div>
          </div>
          {showMinHint && (
            <p
              id='custom-amount-min-hint'
              className='text-xs text-muted-foreground px-1'
            >
              {t('customAmountMin', {
                amount: formatCurrency(effectiveMinCents, currency, locale),
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
