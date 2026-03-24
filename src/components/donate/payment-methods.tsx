'use client';

import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { DonationFormValues } from '@/components/donate/donation-form-context';
import type {
  DerivedPaymentMethod,
  PaymentMethodId,
} from '@/lib/types/payment-methods';

import { useDonationForm } from '@/components/donate/donation-form-context';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { isFeeCollectionEnabled } from '@/lib/utils/fee-collection';
import { derivePaymentMethods } from '@/lib/utils/payment-methods';

const VISIBLE_METHOD_IDS: ReadonlySet<PaymentMethodId> = new Set([
  'bank-transfer',
  'paypal',
  'card',
  'sepa-debit',
]);

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
    switch (methodId) {
      case 'open-banking':
        return t('methods.openBanking');
      case 'bank-transfer':
        return t('methods.bankTransfer');
      case 'paypal':
        return t('methods.paypal');
      case 'card':
        return t('methods.card');
      case 'sepa-debit':
        return t('methods.sepa');
      case 'apple-pay':
        return t('methods.applePay');
      case 'google-pay':
        return t('methods.googlePay');
      default:
        return t('selectMethodPlaceholder');
    }
  }

  function getProviderLabel(provider: DerivedPaymentMethod['provider']) {
    switch (provider) {
      case 'stripe':
        return t('providers.stripe');
      case 'paypal':
        return t('providers.paypal');
      case 'offline':
        return t('providers.offline');
      case 'open-banking':
        return t('providers.open-banking');
      case 'planetcash':
        return t('providers.planetcash');
      default:
        return t('providers.offline');
    }
  }

  function getFeeText(method: DerivedPaymentMethod, donationCurrency: string) {
    if (!method.hasFee) {
      return t('fees.noFee');
    }

    return t('fees.feeAmount', {
      amount: formatCurrency(method.feeAmountCents, donationCurrency),
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
      amount: formatCurrency(method.feeAmountCents, donationCurrency),
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
    return availableMethods.filter(method => VISIBLE_METHOD_IDS.has(method.id));
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
          <h2 className='text-gray-900 text-base font-medium'>{t('title')}</h2>
          <p className='text-gray-600 text-sm'>{t('description')}</p>
        </div>
        <div className='border border-gray-200 rounded-lg p-4 text-sm text-gray-600'>
          {t('empty')}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <h2 className='text-gray-900 text-base font-medium'>{t('title')}</h2>
        <p className='text-gray-600 text-sm'>{t('description')}</p>
      </div>

      <div className='border border-gray-200 rounded-lg'>
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
            <div className='w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center'>
              <Check className='w-2.5 h-2.5 text-white' />
            </div>
            <div>
              <span className='text-sm font-medium text-gray-900'>
                {selectedMethodLabel}
              </span>
              {feeCollectionEnabled &&
                selectedMethod &&
                selectedMethodFeeText && (
                  <div className='flex items-center gap-1 mt-1'>
                    <span className='text-sm text-gray-500'>
                      {selectedMethodFeeText}
                    </span>
                    {selectedMethodFeeTooltip && (
                      <span title={selectedMethodFeeTooltip}>
                        <Info
                          className='w-3 h-3 text-gray-400 cursor-help'
                          aria-label={selectedMethodFeeTooltip}
                        />
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className='w-5 h-5 text-gray-400' />
          ) : (
            <ChevronDown className='w-5 h-5 text-gray-400' />
          )}
        </button>

        {isExpanded && (
          <div className='border-t border-gray-200 p-4 space-y-3'>
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
                    if (method.disabled) {
                      return;
                    }

                    setValue('selectedPaymentMethod', method.id, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                    setIsExpanded(false);
                  }}
                  disabled={method.disabled}
                  className={cn(
                    'w-full p-3 border rounded-lg text-left transition-all',
                    method.disabled
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'hover:border-gray-400 cursor-pointer',
                    isSelected && !method.disabled
                      ? 'border-gray-900 bg-gray-50'
                      : !method.disabled && 'border-gray-200 bg-white'
                  )}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='mt-0.5'>
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                            method.disabled
                              ? 'bg-gray-200 border-gray-300'
                              : isSelected
                                ? 'bg-gray-900 border-gray-900'
                                : 'bg-white border-gray-300'
                          )}
                        >
                          {isSelected && !method.disabled && (
                            <Check className='w-2.5 h-2.5 text-white' />
                          )}
                        </div>
                      </div>

                      <div className='flex-1 space-y-1'>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            method.disabled ? 'text-gray-500' : 'text-gray-900'
                          )}
                        >
                          {methodLabel}
                        </span>
                      </div>
                    </div>

                    {feeCollectionEnabled && (
                      <div
                        className={cn(
                          'ml-3 flex items-center gap-1',
                          method.disabled ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        <span className='text-sm'>{methodFeeText}</span>
                        {methodFeeTooltip && (
                          <span title={methodFeeTooltip}>
                            <Info
                              className='w-4 h-4 cursor-help'
                              aria-label={methodFeeTooltip}
                            />
                          </span>
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
