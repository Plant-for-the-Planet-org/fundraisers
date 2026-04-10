'use client';

import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { DonationFormValues } from '@/components/donate/donation-form-context';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';

import { useDonationForm } from '@/components/donate/donation-form-context';
import { StripeSepaForm } from '@/components/donate/stripe-sepa-form';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';
import { SUPPORTED_METHOD_IDS } from '@/lib/types/payment-methods';

const METHOD_TRANSLATION_KEYS: Record<PaymentMethodId, string> = {
  'bank-transfer': 'methods.bankTransfer',
  paypal: 'methods.paypal',
  card: 'methods.card',
  'sepa-debit': 'methods.sepa',
  'apple-pay': 'methods.applePay',
  'google-pay': 'methods.googlePay',
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

type SelectedMethodTriggerProps = {
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
});

type PaymentMethodOptionProps = {
  methodId: PaymentMethodId;
  methodLabel: string;
  isSelected: boolean;
  showFeeDetails: boolean;
  methodFeeText: string | null;
  methodFeeTooltip: string | null;
  onSelect: (methodId: PaymentMethodId) => void;
};

const PaymentMethodOption = memo(function PaymentMethodOption({
  methodId,
  methodLabel,
  isSelected,
  showFeeDetails,
  methodFeeText,
  methodFeeTooltip,
  onSelect,
}: PaymentMethodOptionProps) {
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
      <div className='flex items-start justify-between'>
        <div className='flex flex-1 items-start gap-3'>
          <div className='mt-0.5'>
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

          <div className='flex-1 space-y-1'>
            <span className='text-sm font-medium'>{methodLabel}</span>
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
  const [isExpanded, setIsExpanded] = useState(false);

  const { fundraiser, donationData, paymentOptions, sepaFormRef } =
    useDonationForm();
  const { control, setValue } = useFormContext<DonationFormValues>();
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });

  const feeCollectionEnabled = isFeeCollectionEnabled();

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
      donationAmountCents: donationData.amount,
    });
  }, [
    donationData.amount,
    donationData.currency,
    fundraiser.workspace?.country,
    paymentOptions,
  ]);

  const visibleMethods = useMemo(() => {
    return availableMethods.filter(method =>
      SUPPORTED_METHOD_IDS.has(method.id)
    );
  }, [availableMethods]);

  useEffect(() => {
    if (visibleMethods.length === 0) return;

    const isSelectedMethodAvailable = visibleMethods.some(
      method => method.id === selectedPaymentMethod
    );

    if (!isSelectedMethodAvailable) {
      setValue('selectedPaymentMethod', visibleMethods[0].id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [visibleMethods, selectedPaymentMethod, setValue]);

  const visibleMethodOptions = useMemo(
    () =>
      visibleMethods.map(method => ({
        id: method.id,
        label: getMethodLabel(method.id),
        feeText: feeCollectionEnabled
          ? getFeeText(method, donationData.currency)
          : null,
        feeTooltip: feeCollectionEnabled
          ? getFeeTooltip(method, donationData.currency)
          : null,
      })),
    [
      donationData.currency,
      feeCollectionEnabled,
      getFeeText,
      getFeeTooltip,
      getMethodLabel,
      visibleMethods,
    ]
  );

  const selectedMethodOption = useMemo(
    () =>
      visibleMethodOptions.find(method => method.id === selectedPaymentMethod),
    [selectedPaymentMethod, visibleMethodOptions]
  );

  const selectedMethodLabel = selectedMethodOption
    ? selectedMethodOption.label
    : t('selectMethodPlaceholder');

  const selectedMethodFeeText = selectedMethodOption?.feeText ?? null;

  const selectedMethodFeeTooltip = selectedMethodOption?.feeTooltip ?? null;
  const showSelectedMethodFeeDetails = Boolean(
    feeCollectionEnabled && selectedMethodOption && selectedMethodFeeText
  );

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleMethodSelect = useCallback(
    (methodId: PaymentMethodId) => {
      setValue('selectedPaymentMethod', methodId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setIsExpanded(false);
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
        <SelectedMethodTrigger
          isExpanded={isExpanded}
          selectedMethodLabel={selectedMethodLabel}
          showFeeDetails={showSelectedMethodFeeDetails}
          selectedMethodFeeText={selectedMethodFeeText}
          selectedMethodFeeTooltip={selectedMethodFeeTooltip}
          onToggle={toggleExpanded}
        />

        {isExpanded && (
          <div className='space-y-3 border-t border-border p-4'>
            {visibleMethodOptions.map(method => {
              const isSelected = selectedPaymentMethod === method.id;

              return (
                <PaymentMethodOption
                  key={method.id}
                  methodId={method.id}
                  methodLabel={method.label}
                  isSelected={isSelected}
                  showFeeDetails={feeCollectionEnabled}
                  methodFeeText={method.feeText}
                  methodFeeTooltip={method.feeTooltip}
                  onSelect={handleMethodSelect}
                />
              );
            })}
          </div>
        )}
      </div>

      {selectedPaymentMethod === 'sepa-debit' && (
        <StripeSepaForm ref={sepaFormRef} />
      )}
    </div>
  );
}
