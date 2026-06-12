import type { OnApproveData } from '@paypal/paypal-js';
import type { PaymentData } from '@/lib/types/payment';
import type { DonationFormValues } from '../donation-form-context';
import type { SubmissionCore } from './donation-submit-flow-types';

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
  withError,
  withSubmitError,
} from '@/lib/donation/donation-submit-state';
import { buildPaymentRequest } from '@/lib/utils/payment-request-builder';

/**
 * PayPal submission flow.
 *
 * Owns the three PayPal callbacks and `paypalDonationIdRef`, the ref that
 * bridges the two-step PayPal handshake: `onPayPalCreateOrder` writes the
 * donationId after creating the donation, and `onPayPalApproved` reads it back
 * once the donor approves. Because it is only used within this flow, the ref is
 * created here rather than in the core.
 *
 * Three asymmetric key-rotation policies are preserved verbatim:
 * - `onPayPalCreateOrder` never rotates (only clears the guard + `stopLoading`),
 *   so its donation key survives into the approve step.
 * - `onPayPalApproved` rotates mid-flow, only after a non-failed payment, with
 *   no rotation in its `finally`.
 * - `onPayPalCreateOrder`'s catch is bespoke: it sets the error state manually
 *   and re-throws, because the PayPal SDK needs the throw to abort the order.
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
    failSubmission,
    finalizeDonation,
    buildPayload,
    token,
    paymentOptions,
  } = core;

  // Shares donationId between the two PayPal callbacks
  const paypalDonationIdRef = useRef<string | null>(null);

  const onPayPalCreateOrder = useCallback(
    async (values: DonationFormValues): Promise<string> => {
      if (submittingRef.current)
        throw new Error('Submission already in progress');
      submittingRef.current = true;

      setDonationState(beginSubmission);

      const { payload } = buildPayload(values, values.selectedPaymentMethod);

      try {
        const donationResponse = await donationService.createDonation(
          payload,
          token || undefined,
          donationKeyRef.current
        );
        paypalDonationIdRef.current = donationResponse.donationId;

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
        setDonationState(prev => ({
          ...prev,
          error: toSubmitError(error),
        }));
        throw error;
      } finally {
        setDonationState(stopLoading);
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      buildPayload,
      submittingRef,
      setDonationState,
      donationKeyRef,
    ]
  );

  const onPayPalApproved = useCallback(
    async (data: OnApproveData): Promise<void> => {
      const donationId = paypalDonationIdRef.current;
      if (!donationId) {
        failSubmission('unexpected');
        return;
      }

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
          setDonationState(
            withError(mapPaymentErrorCode(paymentResponse.errorCode))
          );
          return;
        }

        rotateIdempotencyKeys();

        await finalizeDonation(donationId, token ?? undefined);
      } catch (error) {
        setDonationState(withSubmitError(error));
      } finally {
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      rotateIdempotencyKeys,
      finalizeDonation,
      failSubmission,
      submittingRef,
      setDonationState,
      paymentKeyRef,
    ]
  );

  const onPayPalError = useCallback(() => {
    failSubmission('paypalPaymentError');
  }, [failSubmission]);

  return { onPayPalCreateOrder, onPayPalApproved, onPayPalError };
}
