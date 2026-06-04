import type { DonationFormValues } from './donation-form-context';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { PROVIDER_DISPLAY_NAMES } from '@/lib/utils/payment-methods';
import { useDonationForm } from './donation-form-context';

export function useProcessingFeeInfo() {
  const { control } = useFormContext<DonationFormValues>();
  const { fundraiser, paymentOptions, donationData } = useDonationForm();
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });

  const feeInfo = useMemo(
    () =>
      getDonationProcessingFeeInfo({
        paymentOptions,
        donationAmountCents: donationData.amountCents,
        donationCurrency: donationData.currency,
        workspaceCountry: fundraiser.workspace?.country,
        selectedPaymentMethod,
      }),
    [
      donationData.amountCents,
      donationData.currency,
      fundraiser.workspace?.country,
      paymentOptions,
      selectedPaymentMethod,
    ]
  );

  const paymentProviderName = feeInfo.selectedMethod
    ? (PROVIDER_DISPLAY_NAMES[feeInfo.selectedMethod.provider] ??
      feeInfo.selectedMethod.provider)
    : '';

  return { ...feeInfo, paymentProviderName };
}
