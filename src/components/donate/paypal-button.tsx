'use client';

import type { OnApproveData } from '@paypal/paypal-js';
import type {
  PayPalButtonsComponentProps,
  ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js';
import type { DonationFormValues } from './donation-form-context';

import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { scrollToFirstError } from '@/lib/utils/scroll-into-view';
import { useDonationForm } from './donation-form-context';

interface PayPalButtonProps {
  isSuccess: boolean;
  onPayPalCreateOrder: (values: DonationFormValues) => Promise<string>;
  onPayPalApproved: (data: OnApproveData) => Promise<void>;
  onPayPalError: () => void;
}

export function PayPalButton({
  isSuccess,
  onPayPalCreateOrder,
  onPayPalApproved,
  onPayPalError,
}: PayPalButtonProps) {
  const { paymentOptions, donationData } = useDonationForm();
  const paypalConfig = paymentOptions.gateways.paypal;

  if (!paypalConfig) return null;

  const initialOptions: ReactPayPalScriptOptions = {
    clientId: paypalConfig.authorization.client_id,
    currency: donationData.currency,
    enableFunding: 'venmo',
    disableFunding: 'card,giropay,sofort,sepa',
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtonsInner
        isSuccess={isSuccess}
        onPayPalCreateOrder={onPayPalCreateOrder}
        onPayPalApproved={onPayPalApproved}
        onPayPalError={onPayPalError}
      />
    </PayPalScriptProvider>
  );
}

interface PayPalButtonsInnerProps {
  isSuccess: boolean;
  onPayPalCreateOrder: (values: DonationFormValues) => Promise<string>;
  onPayPalApproved: (data: OnApproveData) => Promise<void>;
  onPayPalError: () => void;
}

/** Must be rendered inside PayPalScriptProvider and FormProvider. */
function PayPalButtonsInner({
  isSuccess,
  onPayPalCreateOrder,
  onPayPalApproved,
  onPayPalError,
}: PayPalButtonsInnerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { trigger, getValues } = useFormContext<DonationFormValues>();

  // Distinguishes a form-validation abort (handled inline by scrolling to the
  // bad field) from a genuine PayPal payment error (which shows the banner).
  const validationAbortedRef = useRef(false);

  const createOrder: PayPalButtonsComponentProps['createOrder'] = async () => {
    // Reset on every attempt so a previous run cannot leave this stale.
    validationAbortedRef.current = false;
    const isValid = await trigger();
    if (!isValid) {
      validationAbortedRef.current = true;
      requestAnimationFrame(() => {
        scrollToFirstError()?.focus?.();
      });
      throw new Error('Form validation failed');
    }
    return onPayPalCreateOrder(getValues());
  };

  const onApprove: PayPalButtonsComponentProps['onApprove'] = async data => {
    setIsProcessing(true);
    try {
      await onPayPalApproved(data);
    } finally {
      setIsProcessing(false);
    }
  };

  const onError: PayPalButtonsComponentProps['onError'] = () => {
    // A failed `trigger()` rejects createOrder, which PayPal surfaces here.
    // That is not a payment error — the field scroll already handled it.
    if (validationAbortedRef.current) {
      validationAbortedRef.current = false;
      return;
    }
    onPayPalError();
  };

  const onCancel: PayPalButtonsComponentProps['onCancel'] = () => {
    setIsProcessing(false);
  };

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
      disabled={isProcessing || isSuccess}
    />
  );
}
