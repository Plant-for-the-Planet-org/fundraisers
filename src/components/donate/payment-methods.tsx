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
import { useAuthStore } from '@/stores/auth-store';
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
  PlanetCashIcon,
  SepaIcon,
} from '@/components/icons/donation';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const METHOD_TRANSLATION_KEYS: Record<PaymentMethodId, string> = {
  bank_transfer: 'methods.bankTransfer',
  paypal: 'methods.paypal',
  card: 'methods.card',
  sepa_debit: 'methods.sepa',
  apple_pay: 'methods.applePay',
  google_pay: 'methods.googlePay',
  planet_cash: 'methods.planetCash',
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
  planet_cash: PlanetCashIcon,
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
  disabled?: boolean;
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
  disabled,
  onSelect,
}: PaymentMethodOptionProps) {
  const MethodLogo = methodLogo;

  return (
    <button
      type='button'
      onClick={() => !disabled && onSelect(methodId)}
      role='radio'
      aria-checked={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-all',
        disabled
          ? 'cursor-not-allowed border-border bg-muted opacity-70'
          : 'hover:border-gray-400 dark:hover:border-gray-500',
        !disabled &&
          (isSelected ? 'border-foreground bg-muted' : 'border-border bg-background')
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
              {isSelected && <Check className='h-2.5 w-2.5 text-background' />}
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
              <span className='px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full'>
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

function PaymentMethodsSkeleton() {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <h2 className='text-foreground font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>
      <div className='border border-border rounded-lg'>
        <div className='space-y-3 p-4'>
          {[0, 1, 2].map(i => (
            <div key={i} className='rounded-lg border border-border p-3'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4 shrink-0 rounded-full' />
                <Skeleton className='h-5 w-12 shrink-0' />
                <Skeleton className='h-4 w-28' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const donorProfile = useAuthStore(state => state.user?.profile);

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

    // Wait for the auth-protected fetch to resolve before pre-selecting.
    // This prevents the visible "shift" where the first method is picked
    // initially and then replaced once `lastPaymentMethod` arrives. While
    // not ready, no method shows as selected — the user simply sees the
    // list with no radio filled in for a brief moment.
    if (!paymentOptionsReady) return;

    const selectedOption = visibleMethodOptions.find(
      m => m.id === selectedPaymentMethod
    );
    const isSelectedMethodEnabled =
      selectedOption !== undefined && !selectedOption.disabled;

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
  }, [
    visibleMethodOptions,
    selectedPaymentMethod,
    setValue,
    lastUsedMethodId,
    paymentOptionsReady,
  ]);

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
                disabled={method.disabled}
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
