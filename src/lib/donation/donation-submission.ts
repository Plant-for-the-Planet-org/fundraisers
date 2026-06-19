import type { DonationPayload } from '../types/donation';
import type { PaymentData, PaymentMethod } from '../types/payment';
import type { PaymentOptions } from '../types/payment-options';

import { donationService } from '../api/donation-service';
import { paymentService } from '../api/payment-service';
import { buildPaymentRequest } from '../utils/payment-request-builder';

function cleanPaymentDetails(
  details: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(details).filter(([_key, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
}

/** PlanetCash: single POST, balance deducted immediately — no payment step needed */
export async function submitPrepaidDonation(
  payload: DonationPayload,
  token: string,
  donationIdempotencyKey: string
) {
  return donationService.createDonation(payload, token, donationIdempotencyKey);
}

interface SubmitStandardPostpaidDonationOptions {
  payload: DonationPayload;
  token: string | undefined;
  donationIdempotencyKey: string;
  paymentIdempotencyKey: string;
  selectedPaymentMethod: PaymentMethod;
  paymentOptions: PaymentOptions;
  paymentDetails: Record<string, string | number | boolean | undefined>;
}

/** Standard postpaid: two-step flow — create donation, then process payment */
export async function submitStandardPostpaidDonation({
  payload,
  token,
  donationIdempotencyKey,
  paymentIdempotencyKey,
  selectedPaymentMethod,
  paymentOptions,
  paymentDetails,
}: SubmitStandardPostpaidDonationOptions) {
  // Step 1: Create donation
  const donationResponse = await donationService.createDonation(
    payload,
    token,
    donationIdempotencyKey
  );

  const paymentData: PaymentData =
    selectedPaymentMethod === 'bank_transfer'
      ? {
          donationId: donationResponse.donationId,
          paymentMethod: 'bank_transfer',
          paymentDetails: {},
        }
      : {
          donationId: donationResponse.donationId,
          paymentMethod: selectedPaymentMethod,
          paymentDetails: cleanPaymentDetails(paymentDetails),
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
