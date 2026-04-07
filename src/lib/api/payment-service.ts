import type { PaymentRequest, PaymentResponse } from '../types/payment';
import type { ErrorType } from './http-error-classifier';

import { API_BASE_URL } from '../constants/app-config';
import { classifyHttpError } from './http-error-classifier';

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

export class PaymentService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Process payment for a donation
   */
  async processPayment(
    donationId: string,
    paymentRequest: PaymentRequest,
    authToken?: string,
    idempotencyKey?: string
  ): Promise<PaymentResponse> {
    const url = `${this.baseURL}/donations/${donationId}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-SESSION-ID': 'web-client',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ paymentRequest }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        error instanceof Error ? error.message : 'Failed to process payment',
        'api',
        'NETWORK_ERROR',
        0,
        {
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const { type, code, debugMessage, status, errorData } =
      await classifyHttpError(response);

    throw new PaymentError(debugMessage, type, code, status, {
      details: errorData,
    });
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
