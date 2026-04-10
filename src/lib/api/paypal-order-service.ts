import type { ErrorType } from './http-error-classifier';

import { API_BASE_URL } from '../constants/app-config';
import { classifyHttpError } from './http-error-classifier';

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

export async function createPaypalOrder(
  donationId: string,
  paypalAccount: string,
  authToken?: string
): Promise<string> {
  const url = `${API_BASE_URL}/donations/${donationId}/paypal/orders`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-SESSION-ID': 'web-client',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        paymentRequest: {
          account: paypalAccount,
          gateway: 'paypal',
          method: 'paypal',
          savePaymentMethod: true,
        },
      }),
    });

    if (!response.ok) {
      const { type, code, debugMessage, status, errorData } =
        await classifyHttpError(response);
      throw new PaypalOrderError(debugMessage, type, code, status, {
        details: errorData,
      });
    }

    const data = await response.json();

    if (!data?.orderId) {
      throw new PaypalOrderError(
        'Invalid response: missing orderId',
        'api',
        'INVALID_RESPONSE',
        200,
        { data }
      );
    }

    return data.orderId as string;
  } catch (error) {
    if (error instanceof PaypalOrderError) {
      throw error;
    }

    throw new PaypalOrderError(
      error instanceof Error ? error.message : 'Failed to create PayPal order',
      'api',
      'NETWORK_ERROR',
      0,
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}
