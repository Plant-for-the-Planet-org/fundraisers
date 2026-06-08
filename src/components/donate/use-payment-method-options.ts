'use client';

import type { ProfilePaymentMethod } from '@/lib/api/user-service';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';
import type { DonationFormValues } from '@/components/donate/donation-form-context';

import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { SUPPORTED_METHOD_IDS } from '@/lib/types/payment-methods';
import { formatCurrency } from '@/lib/utils/currency';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { normalizePaymentMethodId } from '@/lib/utils/payment-method-normalizer';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';
import { useAuthStore } from '@/stores/auth-store';
import { useDonationForm } from '@/components/donate/donation-form-context';
import {
  capitalize,
  getExpiryInfo,
  METHOD_LOGOS,
  METHOD_TRANSLATION_KEYS,
  PROVIDER_TRANSLATION_KEYS,
} from '@/components/donate/payment-methods-helpers';
import { useSavedPaymentMethods } from '@/components/donate/use-saved-payment-methods';

/**
 * A saved card/SEPA method shaped for rendering and pre-selection.
 */
export interface SavedMethodOption {
  id: string;
  typeId: 'card' | 'sepa_debit';
  brand: string | null;
  last4: string;
  expiryDate: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  ariaLabel: string;
  isDefault: boolean;
  expiringSoonLabel: string | undefined;
}

/**
 * A generic payment method option shaped for rendering.
 */
export interface VisibleMethodOption {
  id: PaymentMethodId;
  label: string;
  logo: (typeof METHOD_LOGOS)[PaymentMethodId];
  feeText: string | null;
  feeTooltip: string | null;
  lastUsedLabel: string | undefined;
  remark: string | undefined;
  disabled: boolean;
}

export interface UsePaymentMethodOptionsResult {
  /** Generic methods (card, SEPA, PayPal, …) shaped for rendering. */
  visibleMethodOptions: VisibleMethodOption[];
  /** Flat list of usable saved methods (expired ones removed). */
  savedMethodOptions: SavedMethodOption[];
  /** Saved methods grouped under their parent type id. */
  savedByType: Map<PaymentMethodId, SavedMethodOption[]>;
  /** Returns the saved method to auto-select for a given method id. */
  pickPreferredSaved: (
    methodId: PaymentMethodId
  ) => SavedMethodOption | undefined;
  /** The donor's last-used method, when it is supported. */
  lastUsedMethodId: PaymentMethodId | null;
  /** Whether the saved-methods fetch has settled. */
  savedMethodsReady: boolean;
  /** Whether processing-fee details should be shown. */
  feeCollectionEnabled: boolean;
  /** Whether this donation is recurring (frequency or "make monthly"). */
  isSubscription: boolean;
}

/**
 * Derives the payment method options the donate form renders.
 *
 * Owns the business logic that turns raw `paymentOptions`, saved methods, and
 * the current donation into render-ready option lists: method derivation,
 * saved-method shaping, translation adapters, and preferred-method selection.
 * Keeping it out of the component leaves the component to render and to sync
 * form state, and makes this derivation independently testable.
 */
export function usePaymentMethodOptions(): UsePaymentMethodOptionsResult {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  const locale = useLocale();

  const { fundraiser, donationData, paymentOptions } = useDonationForm();
  const { control } = useFormContext<DonationFormValues>();
  const makeMonthly = useWatch({ control, name: 'makeMonthly' });

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const donorProfile = useAuthStore(state => state.user?.profile);

  const { savedMethods, savedMethodsReady } = useSavedPaymentMethods(
    fundraiser.workspace?.country
  );

  const isSubscription = donationData.frequency !== 'once' || makeMonthly;

  const feeCollectionEnabled = isFeeCollectionEnabled();

  const lastUsedMethodId = useMemo<PaymentMethodId | null>(() => {
    // The offline gateway returns "offline" as the method — the normalizer maps it to "bank_transfer".
    const method = normalizePaymentMethodId(
      paymentOptions.lastPaymentMethod?.split(':')[1]
    );
    return method && SUPPORTED_METHOD_IDS.has(method) ? method : null;
  }, [paymentOptions.lastPaymentMethod]);

  const getMethodLabel = useCallback(
    (methodId: PaymentMethodId) =>
      t(METHOD_TRANSLATION_KEYS[methodId] as never),
    [t]
  );

  const getProviderLabel = useCallback(
    (provider: DerivedPaymentMethod['provider']) =>
      t(PROVIDER_TRANSLATION_KEYS[provider] as never),
    [t]
  );

  const getFeeText = useCallback(
    (method: DerivedPaymentMethod, donationCurrency: string) => {
      if (!method.hasFee) {
        return t('fees.noFee');
      }

      return t('fees.feeAmount', {
        amount: formatCurrency(method.feeAmountCents, donationCurrency, locale),
      });
    },
    [locale, t]
  );

  const getFeeTooltip = useCallback(
    (method: DerivedPaymentMethod, donationCurrency: string) => {
      if (!method.hasFee) {
        return null;
      }

      const alternatives =
        method.feeRegion === 'EU'
          ? t('fees.alternatives.eu') // Update alternatives for EU if open banking is added in the future
          : t('fees.alternatives.default');

      return t('fees.tooltip.withFee', {
        provider: getProviderLabel(method.provider),
        amount: formatCurrency(method.feeAmountCents, donationCurrency, locale),
        alternatives,
      });
    },
    [getProviderLabel, locale, t]
  );

  const availableMethods = useMemo(() => {
    return derivePaymentMethods(paymentOptions, {
      country:
        paymentOptions.effectiveCountry ||
        fundraiser.workspace?.country ||
        'DE',
      currency: donationData.currency,
      donationAmountCents: donationData.amountCents,
    });
  }, [
    donationData.amountCents,
    donationData.currency,
    fundraiser.workspace?.country,
    paymentOptions,
  ]);

  // Only surface a saved method when its type is actually available for this
  // donation (e.g. SEPA is dropped for non-EUR currencies in availableMethods).
  const availableMethodIds = useMemo(
    () => new Set(availableMethods.map(m => m.id)),
    [availableMethods]
  );

  const savedMethodOptions = useMemo<SavedMethodOption[]>(
    () =>
      savedMethods
        .filter(
          (m): m is ProfilePaymentMethod & { type: 'card' | 'sepa_debit' } =>
            (m.type === 'card' || m.type === 'sepa_debit') &&
            availableMethodIds.has(m.type)
        )
        .map(m => {
          const expiry =
            m.type === 'card'
              ? getExpiryInfo(m.expires)
              : { date: null, isExpired: false, isExpiringSoon: false };
          return {
            id: m.id,
            typeId: m.type,
            brand: m.type === 'card' ? (m.brand ?? null) : null,
            last4: m.last4,
            expiryDate: expiry.date,
            isExpired: expiry.isExpired,
            isExpiringSoon: expiry.isExpiringSoon,
            ariaLabel:
              m.type === 'card'
                ? t('saved.cardLabelAria', {
                    brand: m.brand ? capitalize(m.brand) : t('methods.card'),
                    last4: m.last4,
                  })
                : t('saved.sepaLabelAria', { last4: m.last4 }),
            isDefault: m.isDefault,
            expiringSoonLabel: expiry.isExpiringSoon
              ? t('saved.expiringSoon')
              : undefined,
          };
        })
        // Expired cards can't be charged — hide them entirely rather than
        // showing a disabled, unusable row.
        .filter(m => !m.isExpired),
    [savedMethods, availableMethodIds, t]
  );

  // Group saved methods under their parent type so each generic method (card /
  // SEPA) can render its saved methods nested beneath it as a subsection.
  const savedByType = useMemo(() => {
    const map = new Map<PaymentMethodId, SavedMethodOption[]>();
    for (const saved of savedMethodOptions) {
      const list = map.get(saved.typeId) ?? [];
      list.push(saved);
      map.set(saved.typeId, list);
    }
    return map;
  }, [savedMethodOptions]);

  // Returns the saved payment method to auto-select for `methodId`.
  //
  // We prefer cards that are not expiring soon to avoid future recurring
  // payment failures. If multiple healthy cards exist, we use the default one,
  // otherwise the first available card. Expiring-soon cards are only selected
  // when no better option exists.
  const pickPreferredSaved = useCallback(
    (methodId: PaymentMethodId) => {
      const saved = savedByType.get(methodId);
      if (!saved || saved.length === 0) return undefined;
      const healthy = saved.filter(s => !s.isExpiringSoon);
      const pool = healthy.length > 0 ? healthy : saved;
      return pool.find(s => s.isDefault) ?? pool[0];
    },
    [savedByType]
  );

  const visibleMethodOptions = useMemo<VisibleMethodOption[]>(
    () =>
      availableMethods
        .filter(method => {
          // Identify available methods
          if (!SUPPORTED_METHOD_IDS.has(method.id)) return false;
          if (isSubscription && method.id === 'paypal') return false;
          if (method.id === 'planet_cash') {
            return (
              !isSubscription &&
              isAuthenticated &&
              donorProfile?.planetCash != null &&
              donorProfile.planetCash.country === fundraiser.workspace?.country
            );
          }
          return true;
        })
        .map(method => {
          // Configure options for available methods
          if (method.id === 'planet_cash') {
            const pcGateway = paymentOptions.gateways['planet-cash'];
            const available = pcGateway?.available ?? 0;
            const isDisabled = available < donationData.amountCents;
            const balanceText = t('planetCash.availableBalance', {
              amount: formatCurrency(available, donationData.currency, locale),
            });
            return {
              id: method.id,
              label: getMethodLabel(method.id),
              logo: METHOD_LOGOS[method.id],
              feeText: null,
              feeTooltip: null,
              lastUsedLabel: undefined,
              remark: isDisabled
                ? `${balanceText} - ${t('planetCash.insufficientBalance')}`
                : balanceText,
              disabled: isDisabled,
            };
          }

          return {
            id: method.id,
            label: getMethodLabel(method.id),
            logo: METHOD_LOGOS[method.id],
            feeText: feeCollectionEnabled
              ? getFeeText(method, donationData.currency)
              : null,
            feeTooltip: feeCollectionEnabled
              ? getFeeTooltip(method, donationData.currency)
              : null,
            lastUsedLabel:
              method.id === lastUsedMethodId ? t('lastUsed') : undefined,
            remark:
              isSubscription && method.id === 'bank_transfer'
                ? t('bankTransferRemark')
                : undefined,
            disabled: false,
          };
        }),
    [
      availableMethods,
      donationData.amountCents,
      donationData.currency,
      donorProfile,
      feeCollectionEnabled,
      fundraiser.workspace?.country,
      getFeeText,
      getFeeTooltip,
      getMethodLabel,
      isAuthenticated,
      isSubscription,
      lastUsedMethodId,
      locale,
      paymentOptions.gateways,
      t,
    ]
  );

  return {
    visibleMethodOptions,
    savedMethodOptions,
    savedByType,
    pickPreferredSaved,
    lastUsedMethodId,
    savedMethodsReady,
    feeCollectionEnabled,
    isSubscription,
  };
}
