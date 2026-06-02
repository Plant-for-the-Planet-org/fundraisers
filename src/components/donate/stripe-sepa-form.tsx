'use client';

import type { StripeIbanElementChangeEvent } from '@stripe/stripe-js';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { IbanElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormField } from './form-field';

export interface StripeSepaFormHandle {
  createPaymentMethod(billingDetails: {
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zipCode: string;
      country: string;
    };
  }): Promise<{ paymentMethodId: string } | { error: string }>;
  confirmSepaDebitPayment(clientSecret: string): Promise<{ error?: string }>;
  /**
   * Focuses the IBAN field.
   * If the Stripe element is not ready yet, focus is applied when it mounts.
   */
  focus?(): void;
}

const IBAN_ELEMENT_OPTIONS = {
  supportedCountries: ['SEPA'],
  style: {
    base: {
      fontSize: '14px',
      color: '#030712',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#dc2626' },
  },
};

// TODO: make creditor ID dynamic (source TBD)
const CREDITOR_ID = 'DE98ZZZ09999999999';

export const StripeSepaForm = forwardRef<StripeSepaFormHandle>(
  function StripeSepaForm(_props, ref) {
    const stripe = useStripe();
    const elements = useElements();
    const t = useTranslations('Donate.sepa');

    const [ibanComplete, setIbanComplete] = useState(false);
    const [ibanError, setIbanError] = useState<string | null>(null);
    const [accountHolderName, setAccountHolderName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [mandateAccepted, setMandateAccepted] = useState(false);
    const [mandateError, setMandateError] = useState<string | null>(null);

    // The IBAN iframe is not focusable until Stripe finishes mounting it. When
    // `focus()` is called before then (e.g. right after switching to "use a
    // new account"), we defer the focus until `onReady` fires.
    const ibanReadyRef = useRef(false);
    const focusPendingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      async createPaymentMethod(billingDetails) {
        let hasError = false;

        if (!ibanComplete) {
          if (!ibanError) setIbanError(t('ibanRequired'));
          hasError = true;
        }
        if (!accountHolderName.trim()) {
          setNameError(t('accountHolderNameRequired'));
          hasError = true;
        }
        if (!mandateAccepted) {
          setMandateError(t('mandateRequired'));
          hasError = true;
        }
        if (hasError) return { error: t('errors.validationFailed') };

        if (!stripe || !elements)
          return { error: t('errors.stripeNotInitialized') };
        const ibanElement = elements.getElement(IbanElement);
        if (!ibanElement) return { error: t('errors.ibanElementNotFound') };

        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: 'sepa_debit',
          sepa_debit: ibanElement,
          billing_details: {
            name: accountHolderName.trim(),
            email: billingDetails.email,
            address: {
              line1: billingDetails.address.line1,
              line2: billingDetails.address.line2 || undefined,
              city: billingDetails.address.city,
              state: billingDetails.address.state || undefined,
              postal_code: billingDetails.address.zipCode,
              country: billingDetails.address.country,
            },
          },
        });

        if (error)
          return { error: error.message ?? t('errors.paymentMethodFailed') };
        return { paymentMethodId: paymentMethod.id };
      },

      async confirmSepaDebitPayment(clientSecret) {
        if (!stripe) return { error: t('errors.stripeNotInitialized') };
        const { error } = await stripe.confirmSepaDebitPayment(clientSecret);
        return { error: error?.message };
      },

      focus() {
        const ibanElement = elements?.getElement(IbanElement);
        if (ibanElement && ibanReadyRef.current) {
          ibanElement.focus();
        } else {
          focusPendingRef.current = true;
        }
      },
    }));

    const handleIbanReady = () => {
      ibanReadyRef.current = true;
      if (focusPendingRef.current) {
        focusPendingRef.current = false;
        elements?.getElement(IbanElement)?.focus();
      }
    };

    const handleIbanChange = (event: StripeIbanElementChangeEvent) => {
      setIbanComplete(event.complete);
      setIbanError(event.error?.message ?? null);
    };

    return (
      <div className='space-y-4'>
        <FormField label={t('ibanLabel')} error={ibanError ?? undefined}>
          <div className='border border-border rounded-lg p-3'>
            <IbanElement
              options={IBAN_ELEMENT_OPTIONS}
              onChange={handleIbanChange}
              onReady={handleIbanReady}
            />
          </div>
        </FormField>

        <FormField
          label={t('accountHolderName')}
          error={nameError ?? undefined}
        >
          <Input
            value={accountHolderName}
            onChange={e => {
              setAccountHolderName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder={t('accountHolderNamePlaceholder')}
          />
        </FormField>

        <div className='border border-border rounded-lg p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Info className='h-4 w-4 shrink-0 text-muted-foreground' />
            <p className='font-semibold'>{t('mandateTitle')}</p>
          </div>
          <p className='text-sm'>{t('mandateIntro')}</p>

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='font-medium'>{t('creditor')}</span>
              <br />
              {t('creditorName')}
            </div>
            <div>
              <span className='font-medium'>{t('creditorId')}</span>
              <br />
              {CREDITOR_ID}
            </div>
          </div>

          <p className='text-sm'>{t('mandateRights')}</p>

          <div className='space-y-1'>
            <div className='flex items-start gap-2'>
              <Checkbox
                id='sepa-mandate'
                checked={mandateAccepted}
                onCheckedChange={checked => {
                  setMandateAccepted(checked === true);
                  if (checked) setMandateError(null);
                }}
                className='mt-0.5'
              />
              <label
                htmlFor='sepa-mandate'
                className='text-sm cursor-pointer leading-relaxed'
              >
                {t('mandateConsent')}
              </label>
            </div>
            {mandateError && (
              <p className='text-sm text-destructive'>{mandateError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
