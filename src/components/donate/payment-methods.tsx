'use client';

import type { ComponentType } from 'react';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';
import type { DonationFormValues } from '@/components/donate/donation-form-context';

import { memo, useCallback, useEffect, useMemo } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { SUPPORTED_METHOD_IDS } from '@/lib/types/payment-methods';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { normalizePaymentMethodId } from '@/lib/utils/payment-method-normalizer';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';
import { useDonationForm } from '@/components/donate/donation-form-context';
import { StripeCardForm } from '@/components/donate/stripe-card-form';
import { StripeSepaForm } from '@/components/donate/stripe-sepa-form';
import { useFieldError } from '@/components/donate/use-field-error';
import {
  ApplePayIcon,
  BankIcon,
  CreditCard,
  GooglePayIcon,
  PaypalIcon,
  SepaIcon,
} from '@/components/icons/donation';
import { InfoTooltip } from '@/components/ui/info-tooltip';

const METHOD_TRANSLATION_KEYS: Record<PaymentMethodId, string> = {
  bank_transfer: 'methods.bankTransfer',
  paypal: 'methods.paypal',
  card: 'methods.card',
  sepa_debit: 'methods.sepa',
  apple_pay: 'methods.applePay',
  google_pay: 'methods.googlePay',
};

const PROVIDER_TRANSLATION_KEYS: Record<
  DerivedPaymentMethod['provider'],
  string
> = {
  stripe: 'providers.stripe',
  paypal: 'providers.paypal',
  offline: 'providers.offline',
  planetcash: 'providers.planetcash',
};

type PaymentLogoProps = {
  textColor?: string;
};

const METHOD_LOGOS: Record<PaymentMethodId, ComponentType<PaymentLogoProps>> = {
  paypal: PaypalIcon,
  sepa_debit: SepaIcon,
  card: CreditCard,
  bank_transfer: BankIcon,
  apple_pay: ApplePayIcon,
  google_pay: GooglePayIcon,
};

type MethodFeeDetailsProps = {
  feeText: string;
  feeTooltip: string | null;
  containerClassName?: string;
  textClassName?: string;
  iconClassName?: string;
};

const MethodFeeDetails = memo(function MethodFeeDetails({
  feeText,
  feeTooltip,
  containerClassName,
  textClassName,
  iconClassName,
}: MethodFeeDetailsProps) {
  return (
    <div className={cn('flex items-center gap-1', containerClassName)}>
      <span className={cn('text-sm', textClassName)}>{feeText}</span>
      {feeTooltip && (
        <InfoTooltip
          content={feeTooltip}
          className='inline-flex'
          iconClassName={iconClassName}
        />
      )}
    </div>
  );
});

// Preserved in case we want to switch back to a dropdown for payment method selection in the future
/* type SelectedMethodTriggerProps = {
  isExpanded: boolean;
  selectedMethodLabel: string;
  showFeeDetails: boolean;
  selectedMethodFeeText: string | null;
  selectedMethodFeeTooltip: string | null;
  onToggle: () => void;
};

const SelectedMethodTrigger = memo(function SelectedMethodTrigger({
  isExpanded,
  selectedMethodLabel,
  showFeeDetails,
  selectedMethodFeeText,
  selectedMethodFeeTooltip,
  onToggle,
}: SelectedMethodTriggerProps) {
  return (
    <button
      type='button'
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        'w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer',
        isExpanded ? 'rounded-t-lg' : 'rounded-lg'
      )}
    >
      <div className='flex items-center gap-3'>
        <div className='w-4 h-4 rounded-full bg-foreground flex items-center justify-center'>
          <Check className='w-2.5 h-2.5 text-white' />
        </div>
        <div>
          <span className='text-sm font-medium text-foreground'>
            {selectedMethodLabel}
          </span>
          {showFeeDetails && selectedMethodFeeText && (
            <MethodFeeDetails
              feeText={selectedMethodFeeText}
              feeTooltip={selectedMethodFeeTooltip}
              containerClassName='mt-1'
              textClassName='text-muted-foreground'
              iconClassName='text-muted-foreground'
            />
          )}
        </div>
      </div>
      {isExpanded ? (
        <ChevronUp className='h-5 w-5 text-foreground' />
      ) : (
        <ChevronDown className='h-5 w-5 text-foreground' />
      )}
    </button>
  );
}); */

type PaymentMethodOptionProps = {
  methodId: PaymentMethodId;
  methodLabel: string;
  methodLogo?: ComponentType<PaymentLogoProps> | null;
  isSelected: boolean;
  showFeeDetails: boolean;
  methodFeeText: string | null;
  methodFeeTooltip: string | null;
  lastUsedLabel?: string;
  remark?: string;
  onSelect: (methodId: PaymentMethodId) => void;
};

const PaymentMethodOption = memo(function PaymentMethodOption({
  methodId,
  methodLabel,
  methodLogo,
  isSelected,
  showFeeDetails,
  methodFeeText,
  methodFeeTooltip,
  lastUsedLabel,
  remark,
  onSelect,
}: PaymentMethodOptionProps) {
  const MethodLogo = methodLogo;

  return (
    <button
      type='button'
      onClick={() => onSelect(methodId)}
      role='radio'
      aria-checked={isSelected}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-all hover:border-gray-400',
        isSelected ? 'border-foreground bg-muted' : 'border-border bg-white'
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='flex flex-1 items-center gap-3'>
          <div>
            <div
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
                isSelected
                  ? 'border-foreground bg-foreground'
                  : 'border-input bg-background'
              )}
            >
              {isSelected && <Check className='h-2.5 w-2.5 text-white' />}
            </div>
          </div>

          {MethodLogo && (
            <div className='flex h-5 w-12 shrink-0 items-center justify-center'>
              <MethodLogo textColor='#4d5153' />
            </div>
          )}

          <div className='flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5'>
            <span className='text-sm font-medium'>{methodLabel}</span>
            {lastUsedLabel && (
              <span className='px-2 py-0.5 text-xs bg-gray-100 text-muted-foreground rounded-full'>
                {lastUsedLabel}
              </span>
            )}
            {remark && (
              <span className='w-full text-xs text-muted-foreground'>
                {remark}
              </span>
            )}
          </div>
        </div>

        {showFeeDetails && methodFeeText && (
          <MethodFeeDetails
            feeText={methodFeeText}
            feeTooltip={methodFeeTooltip}
            containerClassName='ml-3'
          />
        )}
      </div>
    </button>
  );
});

export function PaymentMethods() {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  const translateError = useFieldError();

  const {
    fundraiser,
    donationData,
    paymentOptions,
    paymentOptionsReady,
    sepaFormRef,
    cardFormRef,
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
  const makeMonthly = useWatch({ control, name: 'makeMonthly' });

  const isSubscription = donationData.frequency !== 'once' || makeMonthly;

  const feeCollectionEnabled = isFeeCollectionEnabled();

  const lastUsedMethodId = useMemo<PaymentMethodId | null>(() => {
    const raw = paymentOptions.lastPaymentMethod;
    if (!raw) return null;
    // The offline gateway returns "offline" as the method — the normalizer maps it to "bank_transfer".
    const methodPart = normalizePaymentMethodId(raw.split(':')[1]);
    return methodPart && SUPPORTED_METHOD_IDS.has(methodPart)
      ? methodPart
      : null;
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
        amount: formatCurrency(
          method.feeAmountCents,
          donationCurrency,
          undefined
        ),
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
        amount: formatCurrency(
          method.feeAmountCents,
          donationCurrency,
          undefined
        ),
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

  const visibleMethods = useMemo(() => {
    return availableMethods.filter(method => {
      if (!SUPPORTED_METHOD_IDS.has(method.id)) return false;
      if (isSubscription && method.id === 'paypal') return false;
      return true;
    });
  }, [availableMethods, isSubscription]);

  useEffect(() => {
    if (visibleMethods.length === 0) return;

    // Wait for the auth-protected fetch to resolve before pre-selecting.
    // This prevents the visible "shift" where the first method is picked
    // initially and then replaced once `lastPaymentMethod` arrives. While
    // not ready, no method shows as selected — the user simply sees the
    // list with no radio filled in for a brief moment.
    if (!paymentOptionsReady) return;

    const isSelectedMethodAvailable = visibleMethods.some(
      method => method.id === selectedPaymentMethod
    );

    // Only auto-pick when there's no valid selection. Once the user (or
    // this effect) has picked something available, leave it alone.
    if (isSelectedMethodAvailable) return;

    const isLastUsedAvailable =
      lastUsedMethodId !== null &&
      visibleMethods.some(method => method.id === lastUsedMethodId);

    const initialMethodId = isLastUsedAvailable
      ? lastUsedMethodId
      : visibleMethods[0].id;

    setValue('selectedPaymentMethod', initialMethodId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [
    visibleMethods,
    selectedPaymentMethod,
    setValue,
    lastUsedMethodId,
    paymentOptionsReady,
  ]);

  const visibleMethodOptions = useMemo(
    () =>
      visibleMethods.map(method => ({
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
            ? t('methods.bankTransferRemark')
            : undefined,
      })),
    [
      donationData.currency,
      feeCollectionEnabled,
      getFeeText,
      getFeeTooltip,
      getMethodLabel,
      isSubscription,
      lastUsedMethodId,
      t,
      visibleMethods,
    ]
  );

  const handleMethodSelect = useCallback(
    (methodId: PaymentMethodId) => {
      setValue('selectedPaymentMethod', methodId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  if (visibleMethods.length === 0) {
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
            const isSelected = selectedPaymentMethod === method.id;
            return (
              <PaymentMethodOption
                key={method.id}
                methodId={method.id}
                methodLabel={method.label}
                methodLogo={method.logo}
                isSelected={isSelected}
                showFeeDetails={feeCollectionEnabled}
                methodFeeText={method.feeText}
                methodFeeTooltip={method.feeTooltip}
                lastUsedLabel={method.lastUsedLabel}
                remark={method.remark}
                onSelect={handleMethodSelect}
              />
            );
          })}
        </div>
      </div>

      {paymentMethodError && (
        <p className='text-sm text-destructive'>{paymentMethodError}</p>
      )}

      {selectedPaymentMethod === 'card' && <StripeCardForm ref={cardFormRef} />}
      {selectedPaymentMethod === 'sepa_debit' && (
        <StripeSepaForm ref={sepaFormRef} />
      )}
    </div>
  );
}
