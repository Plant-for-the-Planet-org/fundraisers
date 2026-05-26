'use client';

import type { DonationFormValues } from '@/components/donate/donation-form-context';

import { useFormContext, useWatch } from 'react-hook-form';
import { useDonationForm } from '@/components/donate/donation-form-context';
import { StripeCardForm } from '@/components/donate/stripe-card-form';
import {
  StripeCardActionsBridge,
  StripeSepaActionsBridge,
} from '@/components/donate/stripe-payment-actions';
import { StripeSepaForm } from '@/components/donate/stripe-sepa-form';

{
  /*
  Saved methods do not need the full Stripe form because the user is not
  entering new payment details.

  However, Stripe may still require 3DS/SCA authentication through an
  `action_required` response, so the bridge component exposes only the
  methods needed to handle those confirmation flows.
*/
}
interface PaymentEntryFormsProps {
  onReadyChange?: (isReady: boolean) => void;
}

export function PaymentEntryForms({ onReadyChange }: PaymentEntryFormsProps) {
  const { cardFormRef, sepaFormRef } = useDonationForm();
  const { control } = useFormContext<DonationFormValues>();
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });
  const selectedSavedMethodId = useWatch({
    control,
    name: 'selectedSavedMethodId',
  });

  if (selectedPaymentMethod === 'card') {
    return selectedSavedMethodId ? (
      <StripeCardActionsBridge ref={cardFormRef} />
    ) : (
      <StripeCardForm ref={cardFormRef} onReadyChange={onReadyChange} />
    );
  }

  if (selectedPaymentMethod === 'sepa_debit') {
    return selectedSavedMethodId ? (
      <StripeSepaActionsBridge ref={sepaFormRef} />
    ) : (
      <StripeSepaForm ref={sepaFormRef} onReadyChange={onReadyChange} />
    );
  }

  return null;
}
