import type { PaymentRequest, PaymentResponse } from '../types/payment';
import type { ErrorType } from './http-error-classifier';

import { classifyPlatformError } from './http-error-classifier';
import { PlatformAPIError, platformFetch } from './platform-fetch';

export class PaymentError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public code: string,
    public status?: number,
    // Diagnostic only - no consumer reads this today. `originalError` may be an Error instance, so don't JSON.stringify `details` or pass it across the server/client boundary without first extracting fields (message/status/kind); an Error serializes to {}.
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

function toPaymentError(err: unknown): PaymentError {
  if (err instanceof PaymentError) return err;

  if (err instanceof PlatformAPIError) {
    if (err.kind === 'timeout') {
      return new PaymentError(err.message, 'api', 'TIMEOUT_ERROR', 0, {
        originalError: err,
      });
    }
    if (err.kind === 'network') {
      return new PaymentError(err.message, 'api', 'NETWORK_ERROR', 0, {
        originalError: err,
      });
    }
    const { type, code } = classifyPlatformError(err.status);
    return new PaymentError(err.message, type, code, err.status, {
      body: err.body,
    });
  }

  return new PaymentError(
    err instanceof Error ? err.message : 'Failed to process payment',
    'api',
    'NETWORK_ERROR',
    0,
    { originalError: err }
  );
}

export class PaymentService {
  /**
   * Process payment for a donation
   */
  async processPayment(
    donationId: string,
    paymentRequest: PaymentRequest,
    authToken?: string,
    idempotencyKey?: string
  ): Promise<PaymentResponse> {
    try {
      const data = await platformFetch<PaymentResponse>(
        `/donations/${donationId}`,
        {
          method: 'PUT',
          token: authToken,
          idempotencyKey,
          body: { paymentRequest },
        }
      );

      // PaymentResponse models all three shapes below (confirmed against backend)
      //   success:                   { id, status: 'success', response? }
      //   needs client action (3DS): { id, status: 'action_required', response }
      //   failed:                    { id, status: 'failed', errorCode, message }
      return data;
    } catch (err) {
      throw toPaymentError(err);
    }
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
