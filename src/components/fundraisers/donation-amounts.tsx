'use client';

import type { ContributionOption } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';

interface DonationAmountsProps {
  amounts: number[];
  currency: string;
  onAmountSelect: (amount: number) => void;
  selectedAmount?: number;
  customAmount?: number;
  onCustomAmountChange: (amount: number) => void;
  customOption?: ContributionOption | null;
}

export function DonationAmounts({
  amounts,
  currency,
  onAmountSelect,
  selectedAmount,
  onCustomAmountChange,
  customOption,
}: DonationAmountsProps) {
  const t = useTranslations('Fundraisers.create.contributionSettings');
  const [isCustomInputSelected, setIsCustomInputSelected] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const symbol = getCurrencySymbol(currency);
  const currencyCode = currency.toUpperCase();
  const currencyLabel =
    symbol === currencyCode ? currencyCode : `${symbol} ${currencyCode}`;

  return (
    <div className='space-y-4'>
      {/* Preset amounts */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3.5'>
        {amounts.map(amount => (
          <Button
            key={amount}
            variant='outline'
            onClick={() => {
              onAmountSelect(amount);
              setIsCustomInputSelected(false);
              setInputValue('');
            }}
            className={cn(
              'h-14 p-5 bg-card rounded-lg border border-border/50 flex items-center gap-3 transition-all justify-start',
              selectedAmount === amount && !isCustomInputSelected
                ? 'border-foreground'
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
              {formatCurrency(amount, currency)}
            </div>
          </Button>
        ))}
      </div>

      {/* Custom amount - only show if custom option exists */}
      {customOption && (
        <div
          className={cn(
            'h-12 px-5 py-6 bg-card rounded-lg border border-border/50 flex justify-between items-center cursor-pointer transition-all',
            isCustomInputSelected ? 'border-foreground' : 'hover:border-border'
          )}
          onClick={() => setIsCustomInputSelected(true)}
        >
          {isCustomInputSelected ? (
            <div className='flex items-center flex-1 gap-2'>
              <input
                type='number'
                step='0.01'
                placeholder={t('enterAmount')}
                value={inputValue}
                min={
                  customOption.min
                    ? (customOption.min / 100).toString()
                    : undefined
                }
                onChange={e => {
                  const newValue = e.target.value;
                  setInputValue(newValue);

                  if (newValue === '' || newValue === '.') {
                    onCustomAmountChange(0);
                  } else {
                    const displayValue = parseFloat(newValue);
                    if (!isNaN(displayValue)) {
                      const valueInCents = Math.round(displayValue * 100);
                      if (
                        !customOption.min ||
                        valueInCents >= customOption.min
                      ) {
                        onCustomAmountChange(valueInCents);
                      }
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
                  if (!/^\d$/.test(e.key) && e.key !== '.') {
                    e.preventDefault();
                  }
                }}
                onBlur={() => {
                  if (!inputValue) setIsCustomInputSelected(false);
                }}
                className='flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground text-base font-semibold p-0 h-auto shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                autoFocus
              />
              <button
                onClick={e => {
                  e.stopPropagation();
                  setInputValue('');
                  onCustomAmountChange(0);
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
              {customOption.label || t('customAmount')}
            </div>
          )}
          <div className='flex items-center gap-1 text-foreground font-bold pointer-events-none'>
            {currencyLabel}
          </div>
        </div>
      )}
    </div>
  );
}
