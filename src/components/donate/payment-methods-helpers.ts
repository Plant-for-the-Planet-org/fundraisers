import type { ComponentType } from 'react';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';

import {
  ApplePayIcon,
  BankIcon,
  CreditCard,
  GooglePayIcon,
  PaypalIcon,
  PlanetCashIcon,
  SepaIcon,
} from '@/components/icons/donation';

export type PaymentLogoProps = {
  textColor?: string;
};

export const METHOD_TRANSLATION_KEYS = {
  bank_transfer: 'methods.bankTransfer',
  paypal: 'methods.paypal',
  card: 'methods.card',
  sepa_debit: 'methods.sepa',
  apple_pay: 'methods.applePay',
  google_pay: 'methods.googlePay',
  planet_cash: 'methods.planetCash',
} as const satisfies Record<PaymentMethodId, string>;

// Translation keys for the "use a new ..." option shown under saved methods.
//
// Add a key when supporting a new reusable payment method type so the
// correct label is shown for its nested "new method" option.
export const NEW_METHOD_TRANSLATION_KEYS: Partial<
  Record<PaymentMethodId, 'saved.newCard' | 'saved.newSepa'>
> = {
  card: 'saved.newCard',
  sepa_debit: 'saved.newSepa',
};

export const PROVIDER_TRANSLATION_KEYS = {
  stripe: 'providers.stripe',
  paypal: 'providers.paypal',
  offline: 'providers.offline',
  planetcash: 'providers.planetcash',
} as const satisfies Record<DerivedPaymentMethod['provider'], string>;

export const METHOD_LOGOS: Record<
  PaymentMethodId,
  ComponentType<PaymentLogoProps>
> = {
  paypal: PaypalIcon,
  sepa_debit: SepaIcon,
  card: CreditCard,
  bank_transfer: BankIcon,
  apple_pay: ApplePayIcon,
  google_pay: GooglePayIcon,
  planet_cash: PlanetCashIcon,
};

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// A card is marked as "expiring soon" if it is within 60 days of the end of
// its expiry month, giving recurring donors time to update it before charges fail.
const EXPIRING_SOON_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

// Normalizes the platform "expires" string (e.g. "1/2027") to MM/YY and
// flags expired / soon-to-expire cards. A card is valid through the last day
// of its expiry month, matching the issuer convention Stripe and the networks
// use.
export function getExpiryInfo(expires: string | null | undefined): {
  date: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  const fallback = {
    date: null,
    isExpired: false,
    isExpiringSoon: false,
  };

  if (!expires) return fallback;

  const match = /^(\d{1,2})\/(\d{2,4})$/.exec(expires.trim());

  if (!match) return fallback;

  const [, monthStr, yearStr] = match;

  const monthNum = Number(monthStr);

  // Validate month
  if (monthNum < 1 || monthNum > 12) {
    return fallback;
  }

  const fullYear =
    yearStr.length === 4 ? Number(yearStr) : 2000 + Number(yearStr);

  const formattedMonth = monthStr.padStart(2, '0');

  const shortYear = String(fullYear).slice(-2);

  // Last moment of expiry month
  const expiryEnd = new Date(fullYear, monthNum, 0, 23, 59, 59);

  const now = Date.now();
  const expiryEndMs = expiryEnd.getTime();
  const isExpired = expiryEndMs < now;

  return {
    date: `${formattedMonth}/${shortYear}`,
    isExpired,
    // Not expired yet, but within the warning window.
    isExpiringSoon: !isExpired && expiryEndMs - now <= EXPIRING_SOON_WINDOW_MS,
  };
}
