'use client';

import type { ProfilePaymentMethod } from '@/lib/api/user-service';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';
import type { DonationFormValues } from '@/components/donate/donation-form-context';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';
import { SUPPORTED_METHOD_IDS } from '@/lib/types/payment-methods';
import { formatCurrency } from '@/lib/utils/currency';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { normalizePaymentMethodId } from '@/lib/utils/payment-method-normalizer';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';
import { useAuthStore } from '@/stores/auth-store';
import { useDonationForm } from '@/components/donate/donation-form-context';
import { PaymentEntryForms } from '@/components/donate/payment-entry-forms';
import {
  MethodFeeDetails,
  PaymentMethodOption,
  RadioDot,
} from '@/components/donate/payment-method-option';
import {
  capitalize,
  getExpiryInfo,
  METHOD_LOGOS,
  METHOD_TRANSLATION_KEYS,
  NEW_METHOD_TRANSLATION_KEYS,
  PROVIDER_TRANSLATION_KEYS,
} from '@/components/donate/payment-methods-helpers';
import { PaymentMethodsSkeleton } from '@/components/donate/payment-methods-skeleton';
import {
  NewMethodOption,
  SavedPaymentMethodOption,
} from '@/components/donate/saved-payment-method-option';
import { useFieldError } from '@/components/donate/use-field-error';
import { useSavedPaymentMethods } from '@/components/donate/use-saved-payment-methods';

export function PaymentMethods() {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  const translateError = useFieldError();

  const {
    fundraiser,
    donationData,
    paymentOptions,
    paymentOptionsReady,
    cardFormRef,
    sepaFormRef,
  } = useDonationForm();
  const { control, setValue } = useFormContext<DonationFormValues>();
  const { errors } = useFormState({ control, name: 'selectedPaymentMethod' });
  const paymentMethodError = translateError(
    errors.selectedPaymentMethod?.message
  );
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });
  const selectedSavedMethodId = useWatch({
    control,
    name: 'selectedSavedMethodId',
  });
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
        amount: formatCurrency(method.feeAmountCents, donationCurrency),
      });
    },
    [t]
  );

  const getFeeTooltip = useCallback(
    (method: DerivedPaymentMethod, donationCurrency: string) => {
      if (!method.hasFee) {
        return null;
      }

      const alternatives =
        method.feeRegion === 'EU'
          ? t('fees.alternatives.eu')
          : t('fees.alternatives.default');

      return t('fees.tooltip.withFee', {
        provider: getProviderLabel(method.provider),
        amount: formatCurrency(method.feeAmountCents, donationCurrency),
        alternatives,
      });
    },
    [getProviderLabel, t]
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

  const savedMethodOptions = useMemo(
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
    const map = new Map<PaymentMethodId, typeof savedMethodOptions>();
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

  const visibleMethodOptions = useMemo(
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
              amount: formatCurrency(available, donationData.currency),
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
      paymentOptions.gateways,
      t,
    ]
  );

  useEffect(() => {
    if (visibleMethodOptions.length === 0) return;

    // Wait for BOTH the auth-protected payment options and the saved-methods
    // fetch before pre-selecting. Picking the generic "card" first and only
    // swapping to a saved card once that fetch lands makes the full card entry
    // form flash on screen for a frame. Initializing once both are ready sets
    // the method and its saved-method id together in one batched update, so the
    // entry form renders directly in its final state. While not ready, no radio
    // shows selected — the user briefly sees the list with nothing filled in.
    if (!paymentOptionsReady || !savedMethodsReady) return;

    const selectedOption = visibleMethodOptions.find(
      m => m.id === selectedPaymentMethod
    );
    const isSelectedMethodEnabled =
      selectedOption !== undefined && !selectedOption.disabled;

    // A valid method is already selected — leave it (and any saved-method
    // choice the donor has made) alone.
    if (isSelectedMethodEnabled) return;

    const enabledOptions = visibleMethodOptions.filter(m => !m.disabled);
    const candidates =
      enabledOptions.length > 0 ? enabledOptions : visibleMethodOptions;

    const isLastUsedAvailable =
      lastUsedMethodId !== null &&
      candidates.some(m => m.id === lastUsedMethodId);

    const initialMethodId = isLastUsedAvailable
      ? lastUsedMethodId
      : candidates[0].id;

    setValue('selectedPaymentMethod', initialMethodId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });

    // Auto-select the preferred saved method (default or first available)
    // instead of defaulting to "use a new payment method".
    const preferredSaved = pickPreferredSaved(initialMethodId);
    setValue('selectedSavedMethodId', preferredSaved?.id ?? '', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [
    visibleMethodOptions,
    selectedPaymentMethod,
    setValue,
    lastUsedMethodId,
    paymentOptionsReady,
    pickPreferredSaved,
    savedMethodsReady,
  ]);

  // Keep `selectedSavedMethodId` valid for the current payment method.
  //
  // Clear it when:
  // - the saved method no longer exists after a refetch
  // - its payment type is no longer selected (for example after a currency change)
  //
  // This prevents submitting a stale `pm_...` id for the wrong payment method.
  useEffect(() => {
    if (!selectedSavedMethodId) return;
    if (!savedMethodsReady) return;
    const match = savedMethodOptions.find(s => s.id === selectedSavedMethodId);
    if (!match || match.typeId !== selectedPaymentMethod) {
      setValue('selectedSavedMethodId', '', {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [
    savedMethodOptions,
    savedMethodsReady,
    selectedPaymentMethod,
    selectedSavedMethodId,
    setValue,
  ]);

  const handleMethodSelect = useCallback(
    (methodId: PaymentMethodId) => {
      setValue('selectedPaymentMethod', methodId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      // Entering new details — clear any previously selected saved method.
      setValue('selectedSavedMethodId', '', { shouldDirty: true });
    },
    [setValue]
  );

  const handleSavedMethodSelect = useCallback(
    (savedMethodId: string, typeId: PaymentMethodId) => {
      setValue('selectedPaymentMethod', typeId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('selectedSavedMethodId', savedMethodId, { shouldDirty: true });
    },
    [setValue]
  );

  // Reference to the form section so we can scroll to it.
  const formSectionRef = useRef<HTMLDivElement>(null);

  // When the user selects a new payment method, show the form, scroll to it,
  // and move focus into its first field.
  const handleNewMethodSelect = useCallback(
    (methodId: PaymentMethodId) => {
      handleMethodSelect(methodId);
      // Wait for React to render the form, then scroll and focus.
      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // Move keyboard focus into the freshly revealed entry form so a
        // keyboard user lands on the first field instead of being stranded on
        // the radio (WCAG 2.4.3). The form's focus() defers until its Stripe
        // element finishes mounting.
        if (methodId === 'card') cardFormRef.current?.focus?.();
        else if (methodId === 'sepa_debit') sepaFormRef.current?.focus?.();
      });
    },
    [handleMethodSelect, cardFormRef, sepaFormRef]
  );

  if (!paymentOptionsReady) return <PaymentMethodsSkeleton />;

  if (visibleMethodOptions.length === 0) {
    return (
      <div className='space-y-3'>
        <div className='space-y-2'>
          <h2 className='text-foreground text-base font-medium'>
            {t('title')}
          </h2>
          <p className='text-muted-foreground text-sm'>{t('description')}</p>
        </div>
        <div className='border border-border rounded-lg p-4 text-sm text-muted-foreground'>
          {t('empty')}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <h2 className='text-foreground font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <div className='border border-border rounded-lg'>
        <div className='space-y-3 p-4'>
          {visibleMethodOptions.map(method => {
            // A generic option is only "selected" when no saved method is
            // active — a saved card and the generic card share the same id.
            const isGenericSelected =
              selectedPaymentMethod === method.id && !selectedSavedMethodId;

            const savedForMethod = savedByType.get(method.id);

            // No saved methods for this type — render the option on its own.
            if (!savedForMethod) {
              return (
                <PaymentMethodOption
                  key={method.id}
                  methodId={method.id}
                  methodLabel={method.label}
                  methodLogo={method.logo}
                  isSelected={isGenericSelected}
                  showFeeDetails={feeCollectionEnabled}
                  methodFeeText={method.feeText}
                  methodFeeTooltip={method.feeTooltip}
                  lastUsedLabel={method.lastUsedLabel}
                  remark={method.remark}
                  disabled={method.disabled}
                  onSelect={handleMethodSelect}
                />
              );
            }

            const HeaderLogo = method.logo;
            const newMethodTranslationKey =
              NEW_METHOD_TRANSLATION_KEYS[method.id];
            // Only types with a configured "Use a new …" label render the
            // saved-method group at all — savedByType.get(method.id) is only
            // populated for those types via the REUSABLE_TYPES filter in
            // useSavedPaymentMethods. The fallback to the generic method
            // label keeps the option labelled even if a new reusable type is
            // added before its copy lands.
            const newMethodLabel = newMethodTranslationKey
              ? t(newMethodTranslationKey as never)
              : method.label;

            return (
              <div
                key={method.id}
                className='rounded-lg border border-border bg-muted/40'
              >
                {/* Header is a label for the type, not a selectable option —
                    the saved instances and the "use a new …" row below are.
                    The radio dot mirrors whichever nested option is active. */}
                <div className='flex items-center justify-between gap-3 border-b border-border px-3 py-2.5'>
                  <div className='flex flex-1 items-center gap-3'>
                    <RadioDot
                      isSelected={selectedPaymentMethod === method.id}
                    />
                    {HeaderLogo && (
                      <div className='flex h-5 w-12 shrink-0 items-center justify-center'>
                        <HeaderLogo textColor='#4d5153' />
                      </div>
                    )}
                    <div className='flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5'>
                      <span className='text-sm font-medium'>
                        {method.label}
                      </span>
                      {method.lastUsedLabel && (
                        <span className='px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full'>
                          {method.lastUsedLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {feeCollectionEnabled && method.feeText && (
                    <MethodFeeDetails
                      feeText={method.feeText}
                      feeTooltip={method.feeTooltip}
                    />
                  )}
                </div>
                <div className='space-y-2 p-3'>
                  <div className='space-y-2 pl-6'>
                    {savedForMethod.map(saved => {
                      // Warn right under the card it refers to — but only when
                      // it's selected for a recurring donation, where a later
                      // charge could fail once the card lapses.
                      const showRecurringHint =
                        isSubscription &&
                        saved.isExpiringSoon &&
                        selectedSavedMethodId === saved.id;
                      return (
                        <div key={saved.id} className='space-y-2'>
                          <SavedPaymentMethodOption
                            typeId={saved.typeId}
                            brand={saved.brand}
                            last4={saved.last4}
                            expiryDate={saved.expiryDate}
                            isExpiringSoon={saved.isExpiringSoon}
                            expiringSoonLabel={saved.expiringSoonLabel}
                            ariaLabel={saved.ariaLabel}
                            isSelected={selectedSavedMethodId === saved.id}
                            onSelect={() =>
                              handleSavedMethodSelect(saved.id, saved.typeId)
                            }
                          />
                          {showRecurringHint && (
                            <p className='flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-700'>
                              <span className='flex h-5 shrink-0 items-center'>
                                <TriangleAlert
                                  className='h-3.5 w-3.5'
                                  aria-hidden='true'
                                />
                              </span>
                              <span>
                                {t('saved.expiringSoonRecurringHint')}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <NewMethodOption
                    label={newMethodLabel}
                    isSelected={isGenericSelected}
                    onSelect={() => handleNewMethodSelect(method.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {paymentMethodError && (
        <p className='text-sm text-destructive'>{paymentMethodError}</p>
      )}

      <div ref={formSectionRef} className='scroll-mt-4'>
        <PaymentEntryForms />
      </div>
    </div>
  );
}
