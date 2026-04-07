import type { DonationPayload } from '../types/donation';
import type { PaymentData, PaymentMethod } from '../types/payment';
import type { PaymentOptions } from '../types/payment-options';

import { donationService } from '../api/donation-service';
import { paymentService } from '../api/payment-service';
import { buildPaymentRequest } from '../utils/payment-request-builder';

interface SubmitStandardDonationOptions {
  payload: DonationPayload;
  token: string | undefined;
  donationIdempotencyKey: string;
  paymentIdempotencyKey: string;
  selectedPaymentMethod: PaymentMethod;
  paymentOptions: PaymentOptions;
  paymentDetails: Record<string, string | number | boolean>;
}

/** Standard payment: Two-step flow — create donation, then process payment */
export async function submitStandardDonation({
  payload,
  token,
  donationIdempotencyKey,
  paymentIdempotencyKey,
  selectedPaymentMethod,
  paymentOptions,
  paymentDetails,
}: SubmitStandardDonationOptions) {
  // Step 1: Create donation
  const donationResponse = await donationService.submitDonation(
    payload,
    token,
    donationIdempotencyKey
  );

  // TODO: When implementing Stripe/PayPal, populate paymentDetails from the
  // respective payment element refs (e.g. paymentMethodId for Stripe, orderId for PayPal)
  // and extend this branch as needed.
  const paymentData: PaymentData =
    selectedPaymentMethod === 'bank-transfer'
      ? {
          donationId: donationResponse.donationId,
          paymentMethod: 'bank-transfer',
          paymentDetails: {},
        }
      : {
          donationId: donationResponse.donationId,
          paymentMethod: selectedPaymentMethod,
          paymentDetails,
        };

  const paymentRequest = buildPaymentRequest(paymentData, paymentOptions);

  const paymentResponse = await paymentService.processPayment(
    paymentData.donationId,
    paymentRequest,
    token,
    paymentIdempotencyKey
  );

  return { donationResponse, paymentResponse };
}
