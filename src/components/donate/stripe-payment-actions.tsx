'use client';

import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { useStripe } from '@stripe/react-stripe-js';

// Lightweight Stripe bridges used when a donor selects a saved payment method.
// The full entry forms stay unmounted (no new details collected), but
// `useDonationSubmit` still needs Stripe confirmation methods for
// `action_required` flows like 3DS/SCA. `createPaymentMethod` intentionally
// errors because saved flows reuse an existing `pm_...` id.

type Translator = ReturnType<typeof useTranslations>;

const notInitialized = (t: Translator) => ({
  error: t('errors.stripeNotInitialized'),
});

const savedFlowCreateStub = async (t: Translator) => notInitialized(t);

export const StripeCardActionsBridge = forwardRef<StripeCardFormHandle>(
  function StripeCardActionsBridge(_props, ref) {
    const stripe = useStripe();
    const t = useTranslations('Donate.card');

    useImperativeHandle(
      ref,
      () => ({
        createPaymentMethod: () => savedFlowCreateStub(t),

        async handleCardAction(clientSecret) {
          if (!stripe) return notInitialized(t);

          const { paymentIntent, error } =
            await stripe.handleCardAction(clientSecret);

          if (error)
            return { error: error.message ?? t('errors.cardActionFailed') };
          if (!paymentIntent)
            return { error: t('errors.paymentIntentNotReturned') };
          return { paymentIntentId: paymentIntent.id };
        },

        async confirmCardPayment(clientSecret, paymentMethod) {
          if (!stripe) return notInitialized(t);

          const options = paymentMethod
            ? { payment_method: paymentMethod }
            : {};
          const { error } = await stripe.confirmCardPayment(
            clientSecret,
            options
          );
          return { error: error?.message };
        },
      }),
      [stripe, t]
    );

    return null;
  }
);

export const StripeSepaActionsBridge = forwardRef<StripeSepaFormHandle>(
  function StripeSepaActionsBridge(_props, ref) {
    const stripe = useStripe();
    const t = useTranslations('Donate.sepa');

    useImperativeHandle(
      ref,
      () => ({
        createPaymentMethod: () => savedFlowCreateStub(t),

        async confirmSepaDebitPayment(clientSecret) {
          if (!stripe) return notInitialized(t);
          const { error } = await stripe.confirmSepaDebitPayment(clientSecret);
          return { error: error?.message };
        },
      }),
      [stripe, t]
    );

    return null;
  }
);
