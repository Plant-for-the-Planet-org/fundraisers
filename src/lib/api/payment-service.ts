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
      return new PaymentError(err.message, 'api', 'TIMEOUT_ERROR', 0, {});
    }
    if (err.kind === 'network') {
      return new PaymentError(err.message, 'api', 'NETWORK_ERROR', 0, {
        originalError: err.message,
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
    { originalError: err instanceof Error ? err.message : 'Unknown error' }
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

      // TODO: Confirm with backend that the following fields from the prior implementation
      // are not returned by this API: success (boolean), paymentId, status 'completed',
      // redirectUrl, message (on success), type (top-level). In real responses, type was
      // nested inside data.response — the top-level field was never populated.
      return data;
    } catch (err) {
      throw toPaymentError(err);
    }
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
