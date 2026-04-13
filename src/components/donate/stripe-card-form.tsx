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
import { FormField } from './form-field';

export interface StripeCardFormHandle {
  createPaymentMethod(billingDetails: {
    name: string;
    email: string;
    address: {
      line1: string;
      city: string;
      postal_code: string;
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

    useImperativeHandle(ref, () => ({
      async createPaymentMethod(billingDetails) {
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
        if (hasError) return { error: 'Validation failed' };

        if (!stripe || !elements) return { error: 'Stripe not initialized' };
        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) return { error: 'Card element not found' };

        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardNumberElement,
          billing_details: billingDetails,
        });

        if (error)
          return { error: error.message ?? 'Payment method creation failed' };
        return { paymentMethodId: paymentMethod.id };
      },

      async handleCardAction(clientSecret) {
        if (!stripe) return { error: 'Stripe not initialized' };
        const { paymentIntent, error } =
          await stripe.handleCardAction(clientSecret);
        if (error) return { error: error.message ?? 'Card action failed' };
        if (!paymentIntent) return { error: 'Payment intent not returned' };
        return { paymentIntentId: paymentIntent.id };
      },

      async confirmCardPayment(clientSecret, paymentMethod) {
        if (!stripe) return { error: 'Stripe not initialized' };
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
          <div className='border border-border rounded-lg p-3'>
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
            <div className='border border-border rounded-lg p-3'>
              <CardExpiryElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardExpiryChange}
              />
            </div>
          </FormField>
          <FormField label={t('cvcLabel')} error={cardCvcError ?? undefined}>
            <div className='border border-border rounded-lg p-3'>
              <CardCvcElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardCvcChange}
              />
            </div>
          </FormField>
        </div>
      </div>
    );
  }
);
