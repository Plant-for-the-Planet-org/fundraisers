'use client';

import type { PaymentMethodId } from '@/lib/types/payment-methods';

import { memo } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardBrandIcon } from '@/components/icons/donation';

type SavedPaymentMethodOptionProps = {
  typeId: PaymentMethodId;
  brand?: string | null;
  last4: string;
  expiryDate?: string | null;
  isExpiringSoon?: boolean;
  expiringSoonLabel?: string;
  ariaLabel: string;
  isSelected: boolean;
  onSelect: () => void;
};

export const SavedPaymentMethodOption = memo(function SavedPaymentMethodOption({
  typeId,
  brand,
  last4,
  expiryDate,
  isExpiringSoon,
  expiringSoonLabel,
  ariaLabel,
  isSelected,
  onSelect,
}: SavedPaymentMethodOptionProps) {
  const showBrand = typeId === 'card';
  return (
    <button
      type='button'
      onClick={onSelect}
      role='radio'
      aria-checked={isSelected}
      aria-label={
        isExpiringSoon && expiringSoonLabel
          ? `${ariaLabel} — ${expiringSoonLabel}`
          : ariaLabel
      }
      className={cn(
        'w-full rounded-lg border px-3 py-2.5 text-left transition-all',
        isSelected
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
