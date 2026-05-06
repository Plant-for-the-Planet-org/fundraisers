'use client';

import type { OnApproveData } from '@paypal/paypal-js';
import type {
  PayPalButtonsComponentProps,
  ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js';
import type { DonationFormValues } from './donation-form-context';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
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

  const createOrder: PayPalButtonsComponentProps['createOrder'] = async () => {
    const isValid = await trigger();
    if (!isValid) {
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
