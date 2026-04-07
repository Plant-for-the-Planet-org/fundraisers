import type {
  FeeRegion,
  PaymentMethodProvider,
} from '@/lib/types/payment-methods';
import { normalizePaymentMethodId } from '@/lib/utils/payment-method-normalizer';

interface FeeStructure {
  percentage: number;
  fixedCents: number;
}

export interface FeeCalculation {
  feeAmountCents: number;
  hasFee: boolean;
  region: FeeRegion;
}

const STRIPE_FEES: Record<FeeRegion, FeeStructure> = {
  US: { percentage: 2.9, fixedCents: 30 },
  EU: { percentage: 1.2, fixedCents: 25 },
  ROW: { percentage: 3.9, fixedCents: 30 },
};

const PAYPAL_FEES: Record<FeeRegion, FeeStructure> = {
  US: { percentage: 2.9, fixedCents: 30 },
  EU: { percentage: 2.5, fixedCents: 35 },
  ROW: { percentage: 3.9, fixedCents: 30 },
};

const EU_COUNTRIES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

function getRegion(country: string | null | undefined): FeeRegion {
  const normalizedCountry = (country ?? 'default').toUpperCase();
  if (normalizedCountry === 'US') {
    return 'US';
  }
  if (EU_COUNTRIES.has(normalizedCountry) || normalizedCountry === 'DEFAULT') {
    return 'EU';
  }
  return 'ROW';
}

export function getProcessingFee(
  provider: PaymentMethodProvider,
  method: string,
  amountCents: number,
  country: string | null | undefined
): FeeCalculation {
  const region = getRegion(country);
  const paymentMethod = normalizePaymentMethodId(method);

  if (provider === 'offline' || provider === 'planetcash') {
    return { feeAmountCents: 0, hasFee: false, region };
  }

  if (provider === 'stripe' && paymentMethod === 'sepa-debit') {
    if (region === 'EU') {
      return { feeAmountCents: 35, hasFee: true, region };
    }
    return { feeAmountCents: 0, hasFee: false, region };
  }

  if (
    provider === 'stripe' &&
    (paymentMethod === 'card' ||
      paymentMethod === 'apple-pay' ||
      paymentMethod === 'google-pay')
  ) {
    const fee = STRIPE_FEES[region];
    const feeAmountCents =
      Math.round(amountCents * (fee.percentage / 100)) + fee.fixedCents;
    return { feeAmountCents, hasFee: true, region };
  }

  if (provider === 'paypal') {
    const fee = PAYPAL_FEES[region];
    const feeAmountCents =
      Math.round(amountCents * (fee.percentage / 100)) + fee.fixedCents;
    return { feeAmountCents, hasFee: true, region };
  }

  return { feeAmountCents: 0, hasFee: false, region };
}
