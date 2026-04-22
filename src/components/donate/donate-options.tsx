'use client';

import type { DonationFormValues } from './donation-form-context';

import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { Checkbox } from '@/components/ui/checkbox';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useDonationForm } from './donation-form-context';

export function DonateOptions() {
  const { control } = useFormContext<DonationFormValues>();
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });
  const { fundraiser, paymentOptions, donationData } = useDonationForm();
  const t = useTranslations('Fundraisers');

  const { feeCollectionEnabled, hasProcessingFee, processingFeeCents } =
    useMemo(() => {
      return getDonationProcessingFeeInfo({
        paymentOptions,
        donationAmountCents: donationData.amountCents,
        donationCurrency: donationData.currency,
        workspaceCountry: fundraiser.workspace?.country,
        selectedPaymentMethod,
      });
    }, [
      donationData.amountCents,
      donationData.currency,
      fundraiser.workspace?.country,
      paymentOptions,
      selectedPaymentMethod,
    ]);

  const showCoverFees = feeCollectionEnabled && hasProcessingFee;
  const showMakeMonthly =
    paymentOptions.recurrency.supported && donationData.frequency === 'once';

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
