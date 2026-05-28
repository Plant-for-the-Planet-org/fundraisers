'use client';

import type { PaymentMethodId } from '@/lib/types/payment-methods';

import { memo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardBrandIcon } from '@/components/icons/donation';

type SavedPaymentMethodOptionProps = {
  typeId: PaymentMethodId;
  brand?: string | null;
  last4: string;
  expiryLabel?: string | null;
  isExpired?: boolean;
  expiredLabel?: string;
  ariaLabel: string;
  isSelected: boolean;
  defaultLabel?: string;
  onSelect: () => void;
};

export const SavedPaymentMethodOption = memo(function SavedPaymentMethodOption({
  typeId,
  brand,
  last4,
  expiryLabel,
  isExpired,
  expiredLabel,
  ariaLabel,
  isSelected,
  defaultLabel,
  onSelect,
}: SavedPaymentMethodOptionProps) {
  const showBrand = typeId === 'card';
  return (
    <button
      type='button'
      onClick={isExpired ? undefined : onSelect}
      role='radio'
      aria-checked={isSelected}
      aria-disabled={isExpired}
      aria-label={
        isExpired && expiredLabel ? `${ariaLabel} — ${expiredLabel}` : ariaLabel
      }
      disabled={isExpired}
      className={cn(
        'w-full rounded-lg border px-3 py-2.5 text-left transition-all',
        isExpired
          ? 'cursor-not-allowed border-border/60 bg-transparent opacity-70'
          : isSelected
            ? 'border-foreground bg-muted hover:border-gray-400'
            : 'border-border/60 bg-transparent hover:border-gray-400'
      )}
    >
      <div className='flex flex-1 items-center gap-3'>
        {showBrand && (
          <div className='flex h-5 w-8 shrink-0 items-center justify-center'>
            <CardBrandIcon brand={brand} />
          </div>
        )}
        <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              isExpired && 'text-muted-foreground'
            )}
          >
            •••• {last4}
          </span>
          {!isExpired && expiryLabel && (
            <span className='text-sm text-muted-foreground tabular-nums'>
              {expiryLabel}
            </span>
          )}
          {!isExpired && defaultLabel && (
            <span className='px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full'>
              {defaultLabel}
            </span>
          )}
        </div>
        {isExpired && expiryLabel && (
          <span className='ml-auto shrink-0 text-sm font-medium text-destructive tabular-nums'>
            {expiredLabel} {expiryLabel}
          </span>
        )}
      </div>
    </button>
  );
});

type NewMethodOptionProps = {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
};

// "Use a new ..." option shown below saved payment methods.
//
// Selecting it clears the saved method selection and switches back to the
// generic payment type, which mounts the Stripe entry form.
//
// The layout intentionally matches saved payment rows so it feels like part
// of the same selection group.
export const NewMethodOption = memo(function NewMethodOption({
  label,
  isSelected,
  onSelect,
}: NewMethodOptionProps) {
  return (
    <div className='border-t border-border pt-2'>
      <button
        type='button'
        onClick={onSelect}
        role='radio'
        aria-checked={isSelected}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-left transition-all',
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
          <span className='text-sm font-medium'>{label}</span>
        </div>
      </button>
    </div>
  );
});
