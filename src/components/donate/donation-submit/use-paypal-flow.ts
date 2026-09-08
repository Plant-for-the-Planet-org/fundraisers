import type { OnApproveData } from '@paypal/paypal-js';
import type { PaymentData } from '@/lib/types/payment';
import type { DonationFormValues } from '../donation-form-context';
import type {
  DonationAttempt,
  SubmissionCore,
} from './donation-submit-flow-types';

import { useCallback, useRef } from 'react';
import { donationService } from '@/lib/api/donation-service';
import { paymentService } from '@/lib/api/payment-service';
import {
  createPaypalOrder,
  PaypalOrderError,
} from '@/lib/api/paypal-order-service';
import { toSubmitError } from '@/lib/donation/donation-submit-errors';
import {
  beginSubmission,
  mapPaymentErrorCode,
  stopLoading,
} from '@/lib/donation/donation-submit-state';
import { buildPaymentRequest } from '@/lib/utils/payment-request-builder';

/**
 * PayPal submission flow.
 *
 * Owns the three PayPal callbacks and `paypalOrderRef`, the ref that bridges
 * the two-step PayPal handshake: `onPayPalCreateOrder` writes the attempt and
 * its donationId after creating the donation, and `onPayPalApproved` reads
 * them back once the donor approves. Because it is only used within this flow,
 * the ref is created here rather than in the core.
 *
 * Three asymmetric key-rotation policies are preserved verbatim:
 * - `onPayPalCreateOrder` never rotates (only clears the guard + `stopLoading`),
 *   so its donation key survives into the approve step.
 * - `onPayPalApproved` rotates mid-flow, only after a non-failed payment, with
 *   no rotation in its `finally`.
 * - `onPayPalCreateOrder`'s catch re-throws after failing the attempt, because
 *   the PayPal SDK needs the throw to abort the order.
 *
 * Shares `submittingRef`, the idempotency-key refs, and the other helpers with
 * the remaining flows via `core`.
 */
export function usePayPalFlow(core: SubmissionCore) {
  const {
    setDonationState,
    submittingRef,
    donationKeyRef,
    paymentKeyRef,
    rotateIdempotencyKeys,
    createAttempt,
    failSubmission,
    token,
    paymentOptions,
  } = core;

  const paypalOrderRef = useRef<{
    attempt: DonationAttempt;
    donationId: string;
  } | null>(null);

  const onPayPalCreateOrder = useCallback(
    async (values: DonationFormValues): Promise<string> => {
      if (submittingRef.current)
        throw new Error('Submission already in progress');
      submittingRef.current = true;

      setDonationState(beginSubmission);

      const attempt = createAttempt(values, values.selectedPaymentMethod);

      try {
        attempt.submitted();

        const donationResponse = await donationService.createDonation(
          attempt.payload,
          token || undefined,
          donationKeyRef.current
        );
        paypalOrderRef.current = {
          attempt,
          donationId: donationResponse.donationId,
        };

        const paypalAccount = paymentOptions.gateways.paypal?.account;
        if (!paypalAccount) {
          throw new PaypalOrderError(
            'Missing PayPal account configuration',
            'api',
            'PAYPAL_ACCOUNT_MISSING'
          );
        }
        const orderId = await createPaypalOrder(
          donationResponse.donationId,
          paypalAccount,
          token || undefined
        );

        return orderId;
      } catch (error) {
        attempt.fail(toSubmitError(error).code);
        throw error;
      } finally {
        setDonationState(stopLoading);
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      createAttempt,
      submittingRef,
      setDonationState,
      donationKeyRef,
    ]
  );

  const onPayPalApproved = useCallback(
    async (data: OnApproveData): Promise<void> => {
      const order = paypalOrderRef.current;
      if (!order) {
        failSubmission('unexpected');
        return;
      }
      const { attempt, donationId } = order;

      const paymentData: PaymentData = {
        donationId,
        paymentMethod: 'paypal',
        paymentDetails: {
          orderID: data.orderID,
          payerID: data.payerID ?? undefined,
          paymentID: data.paymentID ?? undefined,
          billingToken: data.billingToken ?? undefined,
          facilitatorAccessToken: data.facilitatorAccessToken ?? undefined,
        },
      };

      try {
        const paymentRequest = buildPaymentRequest(paymentData, paymentOptions);
        const paymentResponse = await paymentService.processPayment(
          donationId,
          paymentRequest,
          token || undefined,
          paymentKeyRef.current
        );

        if (paymentResponse.status === 'failed') {
          attempt.fail(mapPaymentErrorCode(paymentResponse.errorCode));
          return;
        }

        rotateIdempotencyKeys();

        await attempt.complete(donationId);
      } catch (error) {
        attempt.fail(toSubmitError(error).code);
      } finally {
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      rotateIdempotencyKeys,
      failSubmission,
      submittingRef,
      paymentKeyRef,
    ]
  );

  const onPayPalError = useCallback(() => {
    const attempt = paypalOrderRef.current?.attempt;
    if (attempt) attempt.fail('paypalPaymentError');
    else failSubmission('paypalPaymentError');
  }, [failSubmission]);

  return { onPayPalCreateOrder, onPayPalApproved, onPayPalError };
}
