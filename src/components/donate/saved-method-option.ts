import type { useTranslations } from 'next-intl';
import type { ProfilePaymentMethod } from '@/lib/api/user-service';

import {
  capitalize,
  getExpiryInfo,
} from '@/components/donate/payment-methods-helpers';

/** Translator scoped to the `Fundraisers.donate.paymentMethods` namespace. */
type PaymentMethodsTranslator = ReturnType<
  typeof useTranslations<'Fundraisers.donate.paymentMethods'>
>;

/** Saved-method types that can be reused as a donation source. */
type ReusableMethodType = 'card' | 'sepa_debit';

/**
 * A saved card/SEPA method translated from the platform API into a
 * presentation-ready option the donate UI renders and pre-selects.
 *
 * This is the donate feature's domain view of a saved payment method: it
 * carries display-ready fields (formatted expiry, derived expiry flags,
 * localized aria labels) rather than the raw `ProfilePaymentMethod` API shape.
 */
export interface SavedMethodOption {
  id: string;
  typeId: ReusableMethodType;
  brand: string | null;
  last4: string;
  expiryDate: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  ariaLabel: string;
  isDefault: boolean;
  expiringSoonLabel: string | undefined;
}

// Only card and SEPA saved methods can be reused as a donation source, so the
// option is built from this narrowed shape.
type ReusableSavedMethod = ProfilePaymentMethod & {
  type: ReusableMethodType;
};

function toOption(
  method: ReusableSavedMethod,
  t: PaymentMethodsTranslator
): SavedMethodOption {
  const expiry =
    method.type === 'card'
      ? getExpiryInfo(method.expires)
      : { date: null, isExpired: false, isExpiringSoon: false };

  return {
    id: method.id,
    typeId: method.type,
    brand: method.type === 'card' ? (method.brand ?? null) : null,
    last4: method.last4,
    expiryDate: expiry.date,
    isExpired: expiry.isExpired,
    isExpiringSoon: expiry.isExpiringSoon,
    ariaLabel:
      method.type === 'card'
        ? t('saved.cardLabelAria', {
            brand: method.brand ? capitalize(method.brand) : t('methods.card'),
            last4: method.last4,
          })
        : t('saved.sepaLabelAria', { last4: method.last4 }),
    isDefault: method.isDefault,
    expiringSoonLabel: expiry.isExpiringSoon
      ? t('saved.expiringSoon')
      : undefined,
  };
}

/**
 * Translates the platform's saved payment methods into options for the
 * donate UI.
 *
 * Keeps only reusable card/SEPA types that are available for this donation
 * (e.g. SEPA is dropped for non-EUR currencies), and drops expired cards —
 * they can't be charged, so showing a disabled, unusable row adds no value.
 */
export function buildSavedMethodOptions(
  methods: ProfilePaymentMethod[],
  options: {
    isTypeAvailable: (type: ReusableMethodType) => boolean;
    t: PaymentMethodsTranslator;
  }
): SavedMethodOption[] {
  return methods
    .filter(
      (m): m is ReusableSavedMethod =>
        (m.type === 'card' || m.type === 'sepa_debit') &&
        options.isTypeAvailable(m.type)
    )
    .map(m => toOption(m, options.t))
    .filter(option => !option.isExpired);
}
