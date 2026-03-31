import type { DonationPayload, DonationResponse } from '../types/donation';

import { API_BASE_URL } from '../constants/app-config';

export class DonationError extends Error {
  constructor(
    message: string,
    public type: 'validation' | 'api' | 'business' | 'user',
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DonationError';
  }
}

export class DonationService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private buildHeaders(
    authToken?: string,
    idempotencyKey?: string
  ): Record<string, string> {
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

    return headers;
  }

  private async safeJsonParse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  private transformResponse(data: any): DonationResponse {
    if (!data?.donationId && !data?.id) {
      throw new DonationError(
        'Invalid response from server',
        'api',
        'INVALID_RESPONSE',
        200,
        { data }
      );
    }

    return {
      success: true,
      donationId: data.donationId || data.id,
      message: data.message || 'Donation processed successfully',
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const errorData = await this.safeJsonParse(response);

    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
      errorMessage =
        (errorData as { message?: string }).message || errorMessage;
    }

    switch (response.status) {
      case 400:
        throw new DonationError(
          errorMessage,
          'validation',
          'VALIDATION_ERROR',
          400,
          {
            errors:
              typeof errorData === 'object' &&
              errorData &&
              'errors' in errorData
                ? (errorData as any).errors
                : {},
            details: errorData,
          }
        );

      case 401:
        throw new DonationError(
          'Authentication required or invalid',
          'user',
          'AUTH_ERROR',
          401,
          { details: errorData }
        );

      case 403:
        throw new DonationError('Access denied', 'user', 'ACCESS_DENIED', 403, {
          details: errorData,
        });

      case 422:
        throw new DonationError(
          errorMessage || 'Invalid donation data',
          'business',
          'BUSINESS_LOGIC_ERROR',
          422,
          {
            errors:
              typeof errorData === 'object' &&
              errorData &&
              'errors' in errorData
                ? (errorData as any).errors
                : {},
            details: errorData,
          }
        );

      case 429:
        throw new DonationError(
          'Too many requests. Please try again later.',
          'api',
          'RATE_LIMIT_ERROR',
          429,
          { details: errorData }
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw new DonationError(
          'Server error. Please try again later.',
          'api',
          'SERVER_ERROR',
          response.status,
          { details: errorData }
        );

      default:
        throw new DonationError(
          errorMessage,
          'api',
          'HTTP_ERROR',
          response.status,
          { details: errorData }
        );
    }
  }

  async submitDonation(
    payload: DonationPayload,
    authToken?: string,
    idempotencyKey?: string
  ): Promise<DonationResponse> {
    const url = `${this.baseURL}/donations`;

    const headers = this.buildHeaders(authToken, idempotencyKey);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await this.safeJsonParse(response);

      return this.transformResponse(data);
    } catch (error) {
      if (error instanceof DonationError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new DonationError(
          'Request timed out. Please try again.',
          'api',
          'TIMEOUT_ERROR',
          408
        );
      }

      throw new DonationError(
        error instanceof Error ? error.message : 'Failed to submit donation',
        'api',
        'NETWORK_ERROR',
        0,
        { originalError: error }
      );
    }
  }
}

export const donationService = new DonationService();
