'use client';

import { IbanElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeIbanElementChangeEvent } from '@stripe/stripe-js';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';

import { FormField } from './form-field';

export interface StripeSepaFormHandle {
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
  confirmSepaDebitPayment(clientSecret: string): Promise<{ error?: string }>;
}

const IBAN_ELEMENT_OPTIONS = {
  supportedCountries: ['SEPA'],
  style: {
    base: {
      fontSize: '14px',
      color: 'hsl(var(--foreground))',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
    },
    invalid: {
      color: 'hsl(var(--destructive))',
    },
  },
};

export const StripeSepaForm = forwardRef<StripeSepaFormHandle>(
  function StripeSepaForm(_props, ref) {
    const stripe = useStripe();
    const elements = useElements();
    const t = useTranslations('Donate.sepa');

    const [ibanError, setIbanError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      async createPaymentMethod(billingDetails) {
        if (!stripe || !elements) return { error: 'Stripe not initialized' };
        const ibanElement = elements.getElement(IbanElement);
        if (!ibanElement) return { error: 'IBAN element not found' };

        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: 'sepa_debit',
          sepa_debit: ibanElement,
          billing_details: billingDetails,
        });

        if (error)
          return { error: error.message ?? 'Payment method creation failed' };
        return { paymentMethodId: paymentMethod.id };
      },

      async confirmSepaDebitPayment(clientSecret) {
        if (!stripe) return { error: 'Stripe not initialized' };
        const { error } = await stripe.confirmSepaDebitPayment(clientSecret);
        return { error: error?.message };
      },
    }));

    const handleIbanChange = (event: StripeIbanElementChangeEvent) => {
      setIbanError(event.error?.message ?? null);
    };

    return (
      <div className='space-y-3'>
        <FormField label={t('ibanLabel')} error={ibanError ?? undefined}>
          <div className='border border-border rounded-lg p-3'>
            <IbanElement
              options={IBAN_ELEMENT_OPTIONS}
              onChange={handleIbanChange}
            />
          </div>
        </FormField>

        <p className='text-xs text-muted-foreground'>{t('mandate')}</p>
      </div>
    );
  }
);
