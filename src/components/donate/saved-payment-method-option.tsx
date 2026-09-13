'use client';

import type { PaymentMethodId } from '@/lib/types/payment-methods';

import { Plus, TriangleAlert } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import { cn } from '@/lib/utils';
import { savedMethodRadioValue } from '@/components/donate/payment-methods-helpers';
import { CardBrandIcon } from '@/components/icons/donation';
import { RadioDot } from './payment-method-option';

type SavedPaymentMethodOptionProps = {
  savedMethodId: string;
  typeId: PaymentMethodId;
  brand?: string | null;
  last4: string;
  expiryDate?: string | null;
  isExpiringSoon?: boolean;
  expiringSoonLabel?: string;
  ariaLabel: string;
  isSelected: boolean;
};

export function SavedPaymentMethodOption({
  savedMethodId,
  typeId,
  brand,
  last4,
  expiryDate,
  isExpiringSoon,
  expiringSoonLabel,
  ariaLabel,
  isSelected,
}: SavedPaymentMethodOptionProps) {
  const showBrand = typeId === 'card';
  return (
    <RadioGroup.Item
      value={savedMethodRadioValue(savedMethodId)}
      aria-label={
        isExpiringSoon && expiringSoonLabel
          ? `${ariaLabel}, ${expiringSoonLabel}`
          : ariaLabel
      }
      className={cn(
        'w-full rounded-lg border px-3 py-2.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        isSelected
          ? 'border-foreground bg-muted'
          : 'border-border/60 bg-transparent hover:border-gray-400'
      )}
    >
      <div className='flex items-center gap-3'>
        {showBrand && (
          <div className='flex h-5 w-8 shrink-0 items-center justify-center'>
            <CardBrandIcon brand={brand} />
          </div>
        )}
        <div className='flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5'>
          <span className='text-sm font-medium tabular-nums'>•••• {last4}</span>
          {expiryDate && (
            <span
              className={cn(
                'text-sm tabular-nums',
                isExpiringSoon ? 'text-amber-700' : 'text-muted-foreground'
              )}
            >
              {expiryDate}
            </span>
          )}
          {isExpiringSoon && expiringSoonLabel && (
            <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'>
              <TriangleAlert className='h-3 w-3 shrink-0' aria-hidden='true' />
              {expiringSoonLabel}
            </span>
          )}
        </div>
        <RadioDot isSelected={isSelected} />
      </div>
    </RadioGroup.Item>
  );
}

type NewMethodOptionProps = {
  methodId: PaymentMethodId;
  label: string;
  isSelected: boolean;
};

// "Use a new ..." option shown below saved payment methods.
//
// Selecting it clears the saved method selection and switches back to the
// generic payment type, which mounts the Stripe entry form.
//
// The layout intentionally matches saved payment rows so it feels like part
// of the same selection group.
export function NewMethodOption({
  methodId,
  label,
  isSelected,
}: NewMethodOptionProps) {
  return (
    <div className='border-t border-border pt-2'>
      <RadioGroup.Item
        value={methodId}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          isSelected
            ? 'border-foreground bg-muted'
            : 'border-border/60 bg-transparent hover:border-gray-400'
        )}
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-5 w-8 shrink-0 items-center justify-center'>
            <Plus
              className={cn(
                'h-4 w-4',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
            />
          </div>
          <span className='flex-1 text-sm font-medium'>{label}</span>
          <RadioDot isSelected={isSelected} />
        </div>
      </RadioGroup.Item>
    </div>
  );
}
