'use client';

import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';
import { Checkbox } from '@/components/ui/checkbox';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useDonationForm } from './donation-form-context';
import type { DonationFormValues } from './donation-form-context';

// TODO: Replace with the real fee constant from a shared config once the payment methods
// integration is complete. Keep in sync with donation-summary.tsx in the meantime.
const FEE_CENTS = 70;

export function DonateOptions() {
  const { control } = useFormContext<DonationFormValues>();
  const { paymentOptions, donationData } = useDonationForm();
  const t = useTranslations('Fundraisers');

  // TODO: Replace with getProcessingFee() + isFeeCollectionEnabled() once payment
  // methods are integrated. Until then fee collection is always enabled and uses
  // the hardcoded FEE_CENTS constant.
  const feeCollectionEnabled = true;
  const processingFee = useMemo(
    () => ({
      hasFee: true,
      displayAmount: formatCurrency(FEE_CENTS, donationData.currency),
    }),
    [donationData.currency]
  );

  const showCoverFees = feeCollectionEnabled && processingFee.hasFee;
  const showMakeMonthly =
    paymentOptions.recurrency.supported &&
    donationData.frequency === 'one-time';

  if (!showCoverFees && !showMakeMonthly) return null;

  return (
    <div className='donate-options space-y-4'>
      {showCoverFees && (
        <div className='flex items-start gap-3'>
          <Controller
            control={control}
            name='coverFees'
            render={({ field }) => (
              <Checkbox
                id='coverFees'
                checked={field.value}
                onCheckedChange={field.onChange}
                className='mt-0.5'
              />
            )}
          />
          <div className='flex flex-1 items-start gap-2'>
            <label
              htmlFor='coverFees'
              className='cursor-pointer select-none text-sm font-medium text-foreground'
            >
              {t('donate.options.coverFeesLabel', {
                feeAmount: processingFee.displayAmount,
              })}
            </label>
            <InfoTooltip
              content={t('donate.options.coverFeesTooltip')}
              triggerLabel={t('donate.options.coverFeesTooltipTriggerLabel')}
              className='mt-0.5'
            />
          </div>
        </div>
      )}

      {showMakeMonthly && (
        <label className='flex cursor-pointer items-start gap-3'>
          <Controller
            control={control}
            name='makeMonthly'
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className='mt-0.5'
              />
            )}
          />
          <span className='select-none text-sm font-medium text-foreground'>
            {t('donate.options.makeMonthly')}
          </span>
        </label>
      )}
    </div>
  );
}
