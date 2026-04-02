import type { DonationPayload } from '../types/donation';
import type { PaymentData, PaymentMethod } from '../types/payment';
import type { PaymentOptions } from '../types/payment-options';

import { DonationError, donationService } from '../api/donation-service';
import { paymentService } from '../api/payment-service';
import { buildPaymentRequest } from '../utils/payment-request-builder';

/** Standard payment: Two-step flow — create donation, then process payment */
export async function submitStandardDonation(
  payload: DonationPayload,
  token: string | undefined,
  donationIdempotencyKey: string,
  paymentIdempotencyKey: string,
  selectedPaymentMethod: PaymentMethod,
  paymentOptions: PaymentOptions,
  paymentDetails: Record<string, string | number | boolean>
) {
  // Step 1: Create donation
  const donationResponse = await donationService.submitDonation(
    payload,
    token,
    donationIdempotencyKey
  );

  if (!donationResponse.donationId) {
    throw new DonationError(
      'Failed to create donation',
      'api',
      'DONATION_CREATION_ERROR',
      500
    );
  }

  const paymentData: PaymentData = {
    donationId: donationResponse.donationId,
    paymentMethod: selectedPaymentMethod,
    paymentDetails: paymentDetails,
  };

  const paymentRequest = await buildPaymentRequest(paymentData, paymentOptions);

  const paymentResponse = await paymentService.processPayment(
    paymentData.donationId,
    paymentRequest,
    token,
    paymentIdempotencyKey
  );

  return { donationResponse, paymentResponse };
}
