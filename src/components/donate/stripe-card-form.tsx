'use client';

import type {
  StripeCardCvcElementChangeEvent,
  StripeCardExpiryElementChangeEvent,
  StripeCardNumberElementChangeEvent,
} from '@stripe/stripe-js';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AddressCountrySelector } from './address-country-selector';
import { FormField } from './form-field';

export interface StripeCardFormHandle {
  createPaymentMethod(options: {
    email: string;
    donorAddress: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zipCode: string;
      country: string;
    };
  }): Promise<{ paymentMethodId: string } | { error: string }>;
  handleCardAction(
    clientSecret: string
  ): Promise<{ paymentIntentId: string } | { error: string }>;
  confirmCardPayment(
    clientSecret: string,
    paymentMethod?: string
  ): Promise<{ error?: string }>;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#030712',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#dc2626' },
  },
};

export const StripeCardForm = forwardRef<StripeCardFormHandle>(
  function StripeCardForm(_props, ref) {
    const stripe = useStripe();
    const elements = useElements();
    const t = useTranslations('Donate.card');

    const [cardNumberComplete, setCardNumberComplete] = useState(false);
    const [cardNumberError, setCardNumberError] = useState<string | null>(null);
    const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
    const [cardExpiryError, setCardExpiryError] = useState<string | null>(null);
    const [cardCvcComplete, setCardCvcComplete] = useState(false);
    const [cardCvcError, setCardCvcError] = useState<string | null>(null);
    const [cardholderName, setCardholderName] = useState('');
    const [cardholderNameError, setCardholderNameError] = useState<
      string | null
    >(null);
    const [useDonorAddress, setUseDonorAddress] = useState(true);
    const [billingAddress, setBillingAddress] = useState('');
    const [billingAddressError, setBillingAddressError] = useState<
      string | null
    >(null);
    const [billingAddress2, setBillingAddress2] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingCityError, setBillingCityError] = useState<string | null>(
      null
    );
    const [billingState, setBillingState] = useState('');
    const [billingZipCode, setBillingZipCode] = useState('');
    const [billingZipCodeError, setBillingZipCodeError] = useState<
      string | null
    >(null);
    const [billingCountry, setBillingCountry] = useState('');
    const [billingCountryError, setBillingCountryError] = useState<
      string | null
    >(null);

    useImperativeHandle(ref, () => ({
      async createPaymentMethod({ email, donorAddress }) {
        let hasError = false;

        if (!cardNumberComplete) {
          if (!cardNumberError) setCardNumberError(t('cardNumberRequired'));
          hasError = true;
        }
        if (!cardExpiryComplete) {
          if (!cardExpiryError) setCardExpiryError(t('expiryRequired'));
          hasError = true;
        }
        if (!cardCvcComplete) {
          if (!cardCvcError) setCardCvcError(t('cvcRequired'));
          hasError = true;
        }
        if (!cardholderName.trim()) {
          setCardholderNameError(t('cardholderNameRequired'));
          hasError = true;
        }
        if (!useDonorAddress) {
          if (!billingAddress.trim()) {
            setBillingAddressError(t('address.required'));
            hasError = true;
          }
          if (!billingCity.trim()) {
            setBillingCityError(t('cityRequired'));
            hasError = true;
          }
          if (!billingZipCode.trim()) {
            setBillingZipCodeError(t('billingZipCodeRequired'));
            hasError = true;
          }
          if (!billingCountry) {
            setBillingCountryError(t('countryRequired'));
            hasError = true;
          }
        }
        if (hasError) return { error: t('errors.validationFailed') };

        if (!stripe || !elements)
          return { error: t('errors.stripeNotInitialized') };
        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement)
          return { error: t('errors.cardElementNotFound') };

        const stripeAddress = useDonorAddress
          ? {
              line1: donorAddress.line1,
              line2: donorAddress.line2,
              city: donorAddress.city,
              state: donorAddress.state,
              postal_code: donorAddress.zipCode,
              country: donorAddress.country,
            }
          : {
              line1: billingAddress.trim(),
              line2: billingAddress2.trim() || undefined,
              city: billingCity.trim(),
              state: billingState.trim() || undefined,
              postal_code: billingZipCode.trim(),
              country: billingCountry,
            };

        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardNumberElement,
          billing_details: {
            name: cardholderName.trim(),
            email,
            address: stripeAddress,
          },
        });

        if (error)
          return { error: error.message ?? t('errors.paymentMethodFailed') };
        return { paymentMethodId: paymentMethod.id };
      },

      async handleCardAction(clientSecret) {
        if (!stripe) return { error: t('errors.stripeNotInitialized') };
        const { paymentIntent, error } =
          await stripe.handleCardAction(clientSecret);
        if (error)
          return { error: error.message ?? t('errors.cardActionFailed') };
        if (!paymentIntent)
          return { error: t('errors.paymentIntentNotReturned') };
        return { paymentIntentId: paymentIntent.id };
      },

      async confirmCardPayment(clientSecret, paymentMethod) {
        if (!stripe) return { error: t('errors.stripeNotInitialized') };
        const { error } = await stripe.confirmCardPayment(
          clientSecret,
          paymentMethod ? { payment_method: paymentMethod } : {}
        );
        return { error: error?.message };
      },
    }));

    const handleCardNumberChange = (
      event: StripeCardNumberElementChangeEvent
    ) => {
      setCardNumberComplete(event.complete);
      setCardNumberError(event.error?.message ?? null);
    };

    const handleCardExpiryChange = (
      event: StripeCardExpiryElementChangeEvent
    ) => {
      setCardExpiryComplete(event.complete);
      setCardExpiryError(event.error?.message ?? null);
    };

    const handleCardCvcChange = (event: StripeCardCvcElementChangeEvent) => {
      setCardCvcComplete(event.complete);
      setCardCvcError(event.error?.message ?? null);
    };

    return (
      <div className='space-y-4'>
        <FormField
          label={t('cardNumberLabel')}
          error={cardNumberError ?? undefined}
        >
          <div className='mt-2 border border-border rounded-lg p-3'>
            <CardNumberElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardNumberChange}
            />
          </div>
        </FormField>

        <div className='grid grid-cols-2 gap-3'>
          <FormField
            label={t('expiryLabel')}
            error={cardExpiryError ?? undefined}
          >
            <div className='mt-2 border border-border rounded-lg p-3'>
              <CardExpiryElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardExpiryChange}
              />
            </div>
          </FormField>
          <FormField label={t('cvcLabel')} error={cardCvcError ?? undefined}>
            <div className='mt-2 border border-border rounded-lg p-3'>
              <CardCvcElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardCvcChange}
              />
            </div>
          </FormField>
        </div>

        <FormField
          label={t('cardholderNameLabel')}
          error={cardholderNameError ?? undefined}
        >
          <Input
            value={cardholderName}
            onChange={e => {
              setCardholderName(e.target.value);
              if (cardholderNameError) setCardholderNameError(null);
            }}
            placeholder={t('cardholderNamePlaceholder')}
            className='mt-2'
          />
        </FormField>

        <div className='flex items-center gap-2'>
          <Checkbox
            id='card-use-donor-address'
            checked={useDonorAddress}
            onCheckedChange={checked => setUseDonorAddress(checked === true)}
          />
          <label
            htmlFor='card-use-donor-address'
            className='text-sm cursor-pointer'
          >
            {t('useDonorAddressLabel')}
          </label>
        </div>

        {!useDonorAddress && (
          <div className='space-y-4'>
            <FormField
              label={t('address.label')}
              error={billingAddressError ?? undefined}
            >
              <Input
                value={billingAddress}
                onChange={e => {
                  setBillingAddress(e.target.value);
                  if (billingAddressError) setBillingAddressError(null);
                }}
                placeholder={t('address.placeholder')}
                className='mt-2'
              />
            </FormField>

            <FormField label={t('address2.label')}>
              <Input
                value={billingAddress2}
                onChange={e => setBillingAddress2(e.target.value)}
                placeholder={t('address2.placeholder')}
                className='mt-2'
              />
            </FormField>

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                label={t('cityLabel')}
                error={billingCityError ?? undefined}
              >
                <Input
                  value={billingCity}
                  onChange={e => {
                    setBillingCity(e.target.value);
                    if (billingCityError) setBillingCityError(null);
                  }}
                  placeholder={t('cityPlaceholder')}
                  className='mt-2'
                />
              </FormField>
              <FormField label={t('stateLabel')}>
                <Input
                  value={billingState}
                  onChange={e => setBillingState(e.target.value)}
                  placeholder={t('statePlaceholder')}
                  className='mt-2'
                />
              </FormField>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <AddressCountrySelector
                country={billingCountry || undefined}
                onCountryChange={code => {
                  setBillingCountry(code);
                  if (billingCountryError) setBillingCountryError(null);
                }}
                onCountryBlur={() => {
                  if (!billingCountry)
                    setBillingCountryError(t('countryRequired'));
                }}
                error={billingCountryError ?? undefined}
                label={t('countryLabel')}
                placeholder={t('countryPlaceholder')}
                noResultsText={t('countryNoResults')}
              />
              <FormField
                label={t('billingZipCodeLabel')}
                error={billingZipCodeError ?? undefined}
              >
                <Input
                  value={billingZipCode}
                  onChange={e => {
                    setBillingZipCode(e.target.value);
                    if (billingZipCodeError) setBillingZipCodeError(null);
                  }}
                  placeholder={t('billingZipCodePlaceholder')}
                  className='mt-2'
                />
              </FormField>
            </div>
          </div>
        )}
      </div>
    );
  }
);
