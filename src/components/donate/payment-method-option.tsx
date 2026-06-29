'use client';

import type { ComponentType } from 'react';
import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { PaymentLogoProps } from '@/components/donate/payment-methods-helpers';

import { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';

type MethodFeeDetailsProps = {
  feeText: string;
  feeTooltip: string | null;
  containerClassName?: string;
  textClassName?: string;
  iconClassName?: string;
};

export const MethodFeeDetails = memo(function MethodFeeDetails({
  feeText,
  feeTooltip,
  containerClassName,
  textClassName,
  iconClassName,
}: MethodFeeDetailsProps) {
  return (
    <div className={cn('flex items-center gap-1', containerClassName)}>
      <span className={cn('text-sm', textClassName)}>{feeText}</span>
      {feeTooltip && (
        <InfoTooltip
          content={feeTooltip}
          className='inline-flex'
          iconClassName={iconClassName}
        />
      )}
    </div>
  );
});

// Shared radio indicator used by every selectable payment option.
export function RadioDot({ isSelected }: { isSelected: boolean }) {
  return (
    <div
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
        isSelected
          ? 'border-foreground bg-foreground'
          : 'border-input bg-background'
      )}
    >
      {isSelected && <Check className='h-2.5 w-2.5 text-white' />}
    </div>
  );
}

type PaymentMethodOptionProps = {
  methodId: PaymentMethodId;
  methodLabel: string;
  methodLogo?: ComponentType<PaymentLogoProps> | null;
  isSelected: boolean;
  showFeeDetails: boolean;
  methodFeeText: string | null;
  methodFeeTooltip: string | null;
  lastUsedLabel?: string;
  remark?: string;
  disabled?: boolean;
  onSelect: (methodId: PaymentMethodId) => void;
};

export const PaymentMethodOption = memo(function PaymentMethodOption({
  methodId,
  methodLabel,
  methodLogo,
  isSelected,
  showFeeDetails,
  methodFeeText,
  methodFeeTooltip,
  lastUsedLabel,
  remark,
  disabled,
  onSelect,
}: PaymentMethodOptionProps) {
  const MethodLogo = methodLogo;

  return (
    <button
      type='button'
      onClick={() => !disabled && onSelect(methodId)}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-all',
        disabled
          ? 'cursor-not-allowed border-border bg-muted opacity-70'
          : 'hover:border-gray-400',
        !disabled &&
          (isSelected ? 'border-foreground bg-muted' : 'border-border bg-white')
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='flex flex-1 items-center gap-3'>
          <div>
            <RadioDot isSelected={isSelected} />
          </div>

          {MethodLogo && (
            <div className='flex h-4 w-12 shrink-0 items-center justify-center text-muted-foreground'>
              <MethodLogo textColor='currentColor' />
            </div>
          )}

          <div className='flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5'>
            <span className='text-sm font-medium'>{methodLabel}</span>
            {lastUsedLabel && (
              <span className='px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full'>
                {lastUsedLabel}
              </span>
            )}
            {remark && (
              <span className='w-full text-xs text-muted-foreground'>
                {remark}
              </span>
            )}
          </div>
        </div>

        {showFeeDetails && methodFeeText && (
          <MethodFeeDetails
            feeText={methodFeeText}
            feeTooltip={methodFeeTooltip}
            containerClassName='ml-3'
          />
        )}
      </div>
    </button>
  );
});
