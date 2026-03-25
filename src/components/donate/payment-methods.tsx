'use client';

import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { DonationFormValues } from '@/components/donate/donation-form-context';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';

import { useDonationForm } from '@/components/donate/donation-form-context';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';
import { SUPPORTED_METHOD_IDS } from '@/lib/types/payment-methods';

const METHOD_TRANSLATION_KEYS: Record<PaymentMethodId, string> = {
  'open-banking': 'methods.openBanking',
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
  'open-banking': 'providers.open-banking',
  planetcash: 'providers.planetcash',
};

export function PaymentMethods() {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  const [isExpanded, setIsExpanded] = useState(false);

  const { fundraiser, donationData, paymentOptions } = useDonationForm();
  const { control, setValue } = useFormContext<DonationFormValues>();
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });

  const feeCollectionEnabled = isFeeCollectionEnabled();

  function getMethodLabel(methodId: PaymentMethodId) {
    return t(METHOD_TRANSLATION_KEYS[methodId] as never);
  }

  function getProviderLabel(provider: DerivedPaymentMethod['provider']) {
    return t(PROVIDER_TRANSLATION_KEYS[provider] as never);
  }

  function getFeeText(method: DerivedPaymentMethod, donationCurrency: string) {
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
  }

  function getFeeTooltip(
    method: DerivedPaymentMethod,
    donationCurrency: string
  ) {
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
  }

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
    if (visibleMethods.length === 0) {
      if (selectedPaymentMethod) {
        setValue('selectedPaymentMethod', '', {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
      return;
    }

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

  const selectedMethod = visibleMethods.find(
    method => method.id === selectedPaymentMethod
  );

  const selectedMethodLabel = selectedMethod
    ? getMethodLabel(selectedMethod.id)
    : t('selectMethodPlaceholder');

  const selectedMethodFeeText = selectedMethod
    ? getFeeText(selectedMethod, donationData.currency)
    : null;

  const selectedMethodFeeTooltip = selectedMethod
    ? getFeeTooltip(selectedMethod, donationData.currency)
    : null;

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
        <button
          type='button'
          onClick={() => {
            setIsExpanded(prev => !prev);
          }}
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
              {feeCollectionEnabled &&
                selectedMethod &&
                selectedMethodFeeText && (
                  <div className='mt-1 flex items-center gap-1'>
                    <span className='text-sm text-muted-foreground'>
                      {selectedMethodFeeText}
                    </span>
                    {selectedMethodFeeTooltip && (
                      <InfoTooltip
                        content={selectedMethodFeeTooltip}
                        className='inline-flex'
                        iconClassName='text-muted-foreground'
                      />
                    )}
                  </div>
                )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className='h-5 w-5 text-foreground' />
          ) : (
            <ChevronDown className='h-5 w-5 text-foreground' />
          )}
        </button>

        {isExpanded && (
          <div className='space-y-3 border-t border-border p-4'>
            {visibleMethods.map(method => {
              const methodLabel = getMethodLabel(method.id);
              const methodFeeText = getFeeText(method, donationData.currency);
              const methodFeeTooltip = getFeeTooltip(
                method,
                donationData.currency
              );
              const isSelected = selectedPaymentMethod === method.id;

              return (
                <button
                  type='button'
                  key={method.id}
                  onClick={() => {
                    setValue('selectedPaymentMethod', method.id, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                    setIsExpanded(false);
                  }}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-all hover:border-gray-400',
                    isSelected
                      ? 'border-foreground bg-muted'
                      : 'border-border bg-white'
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
                          {isSelected && (
                            <Check className='h-2.5 w-2.5 text-white' />
                          )}
                        </div>
                      </div>

                      <div className='flex-1 space-y-1'>
                        <span className='text-sm font-medium'>
                          {methodLabel}
                        </span>
                      </div>
                    </div>

                    {feeCollectionEnabled && (
                      <div className='ml-3 flex items-center gap-1'>
                        <span className='text-sm'>{methodFeeText}</span>
                        {methodFeeTooltip && (
                          <InfoTooltip
                            content={methodFeeTooltip}
                            className='inline-flex'
                          />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
