import type { DerivedPaymentMethod } from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { SUPPORTED_METHOD_IDS } from '@/lib/types/payment-methods';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';

interface DonationProcessingFeeInfoParams {
  paymentOptions: PaymentOptions;
  donationAmountCents: number;
  donationCurrency: string;
  workspaceCountry?: string | null;
  selectedPaymentMethod?: string | null;
}

export interface DonationProcessingFeeInfo {
  visibleMethods: DerivedPaymentMethod[];
  selectedMethod: DerivedPaymentMethod | null;
  feeCollectionEnabled: boolean;
  hasProcessingFee: boolean;
  processingFeeCents: number;
}

export function getDonationProcessingFeeInfo({
  paymentOptions,
  donationAmountCents,
  donationCurrency,
  workspaceCountry,
  selectedPaymentMethod,
}: DonationProcessingFeeInfoParams): DonationProcessingFeeInfo {
  const feeCollectionEnabled = isFeeCollectionEnabled();

  const availableMethods = derivePaymentMethods(paymentOptions, {
    country: paymentOptions.effectiveCountry || workspaceCountry || 'DE',
    currency: donationCurrency,
    donationAmountCents,
  });

  const visibleMethods = availableMethods.filter(method =>
    SUPPORTED_METHOD_IDS.has(method.id)
  );

  const selectedMethod =
    visibleMethods.find(method => method.id === selectedPaymentMethod) ??
    visibleMethods[0] ??
    null;

  const processingFeeCents =
    feeCollectionEnabled && selectedMethod?.hasFee
      ? selectedMethod.feeAmountCents
      : 0;

  return {
    visibleMethods,
    selectedMethod,
    feeCollectionEnabled,
    hasProcessingFee: processingFeeCents > 0,
    processingFeeCents,
  };
}
