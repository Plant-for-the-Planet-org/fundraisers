'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import type { ContributionOption } from '@/lib/types/fundraiser';

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
              'h-14 p-5 bg-white rounded-lg border border-stone-300/50 flex items-center gap-3 transition-all justify-start',
              selectedAmount === amount && !isCustomInputSelected
                ? 'border-zinc-800'
                : 'hover:border-stone-400'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-lg border transition-all flex items-center justify-center',
                selectedAmount === amount && !isCustomInputSelected
                  ? 'bg-zinc-800 border-zinc-800'
                  : 'border-gray-300'
              )}
            >
              {selectedAmount === amount && !isCustomInputSelected && (
                <Check className='w-3 h-3 text-white' />
              )}
            </div>
            <div className='text-zinc-800 text-base font-semibold'>
              {formatCurrency(amount, currency)}
            </div>
          </Button>
        ))}
      </div>

      {/* Custom amount - only show if custom option exists */}
      {customOption && (
        <div
          className={cn(
            'h-12 px-5 py-6 bg-white rounded-lg border border-stone-300/50 flex justify-between items-center cursor-pointer transition-all',
            isCustomInputSelected ? 'border-zinc-800' : 'hover:border-stone-400'
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
                className='flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-800 text-base font-semibold p-0 h-auto shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                autoFocus
              />
              <button
                onClick={e => {
                  e.stopPropagation();
                  setInputValue('');
                  onCustomAmountChange(0);
                  setIsCustomInputSelected(false);
                }}
                className='text-gray-400 hover:text-gray-600 transition-colors'
                type='button'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          ) : (
            <div className='opacity-60 text-zinc-800 text-base font-normal'>
              {customOption.label || t('customAmount')}
            </div>
          )}
          <div className='flex items-center gap-1 text-zinc-700 font-bold pointer-events-none'>
            {getCurrencySymbol(currency)} {currency.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
