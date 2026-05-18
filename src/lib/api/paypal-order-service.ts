import type { ErrorType } from './http-error-classifier';

import { classifyPlatformError } from './http-error-classifier';
import { PlatformAPIError, platformFetch } from './platform-fetch';

export class PaypalOrderError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaypalOrderError';
  }
}

function toPaypalOrderError(err: unknown): PaypalOrderError {
  if (err instanceof PaypalOrderError) return err;

  if (err instanceof PlatformAPIError) {
    if (err.kind === 'timeout') {
      return new PaypalOrderError(err.message, 'api', 'TIMEOUT_ERROR', 0, {});
    }
    if (err.kind === 'network') {
      return new PaypalOrderError(err.message, 'api', 'NETWORK_ERROR', 0, {
        originalError: err.message,
      });
    }
    const { type, code } = classifyPlatformError(err.status);
    return new PaypalOrderError(err.message, type, code, err.status, {
      body: err.body,
    });
  }

  return new PaypalOrderError(
    err instanceof Error ? err.message : 'Failed to create PayPal order',
    'api',
    'NETWORK_ERROR',
    0,
    { originalError: err instanceof Error ? err.message : 'Unknown error' }
  );
}

export async function createPaypalOrder(
  donationId: string,
  paypalAccount: string,
  authToken?: string
): Promise<string> {
  try {
    const data = await platformFetch<{ orderId?: string }>(
      `/donations/${donationId}/paypal/orders`,
      {
        method: 'POST',
        token: authToken,
        body: {
          paymentRequest: {
            account: paypalAccount,
            gateway: 'paypal',
            method: 'paypal',
            savePaymentMethod: true,
          },
        },
      }
    );

    if (!data?.orderId) {
      throw new PaypalOrderError(
        'Invalid response: missing orderId',
        'api',
        'INVALID_RESPONSE',
        200,
        { data }
      );
    }

    return data.orderId;
  } catch (err) {
    throw toPaypalOrderError(err);
  }
}
