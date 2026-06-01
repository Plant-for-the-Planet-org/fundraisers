'use client';

import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';
import { Checkbox } from '@/components/ui/checkbox';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useDonationForm } from './donation-form-context';
import { useProcessingFeeInfo } from './use-processing-fee-info';

export function DonateOptions() {
  const { control, setValue } = useFormContext<DonationFormValues>();
  const { paymentOptions, donationData } = useDonationForm();
  const {
    feeCollectionEnabled,
    hasProcessingFee,
    processingFeeCents,
    paymentProviderName,
  } = useProcessingFeeInfo();
  const t = useTranslations('Fundraisers');

  const isInitiallyOneTime = donationData.frequency === 'once';
  const showCoverFees =
    feeCollectionEnabled &&
    hasProcessingFee &&
    isInitiallyOneTime &&
    !!paymentProviderName;
  const showMakeMonthly =
    paymentOptions.recurrency.supported && isInitiallyOneTime;

  useEffect(() => {
    if (!isInitiallyOneTime) setValue('willAbsorbFee', false);
  }, [isInitiallyOneTime, setValue]);

  if (!showCoverFees && !showMakeMonthly) return null;

  return (
    <div className='donate-options space-y-4'>
      {showCoverFees && (
        <div className='flex items-start gap-3'>
          <Controller
            control={control}
            name='willAbsorbFee'
            render={({ field }) => (
              <Checkbox
                id='willAbsorbFee'
                checked={field.value}
                onCheckedChange={field.onChange}
                className='mt-0.5'
              />
            )}
          />
          <div className='flex flex-1 items-start gap-2'>
            <label
              htmlFor='willAbsorbFee'
              className='cursor-pointer select-none text-sm font-medium text-foreground'
            >
              {t('donate.options.coverFeesLabel', {
                feeAmount: formatCurrency(
                  processingFeeCents,
                  donationData.currency
                ),
                providerName: paymentProviderName,
              })}
            </label>
            <InfoTooltip
              content={t('donate.options.coverFeesTooltip', {
                providerName: paymentProviderName,
              })}
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
