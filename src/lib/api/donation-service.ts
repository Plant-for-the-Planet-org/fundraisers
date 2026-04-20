import type {
  DonationPayload,
  DonationResponse,
  DonationStatusResponse,
} from '../types/donation';
import type { ErrorType } from './http-error-classifier';

import { API_BASE_URL } from '../constants/app-config';
import { classifyHttpError } from './http-error-classifier';

export class DonationError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DonationError';
  }
}

const DONATION_TIMEOUT_MS = 30_000;

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

  private async safeJsonParse(response: Response): Promise<unknown> {
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
      uid: data.uid,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency ?? 'once',
      message: data.message || 'Donation processed successfully',
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const { type, code, debugMessage, status, errorData } =
      await classifyHttpError(response);

    const details: Record<string, unknown> = { details: errorData };

    // Preserve field-level errors for validation/business statuses
    if (
      (status === 400 || status === 422) &&
      errorData &&
      typeof errorData === 'object' &&
      'errors' in errorData
    ) {
      details.errors = (errorData as { errors: unknown }).errors;
    }

    throw new DonationError(debugMessage, type, code, status, details);
  }

  private transformStatusResponse(data: any): DonationStatusResponse {
    if (!data?.id || !data?.paymentStatus) {
      throw new DonationError(
        'Invalid status response from server',
        'api',
        'INVALID_RESPONSE',
        200,
        { data }
      );
    }

    return {
      id: data.id,
      gateway: data.gateway,
      paymentStatus: data.paymentStatus,
      paymentDate: data.paymentDate ?? null,
      uid: data.uid,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency ?? null,
      account: data.account ?? undefined,
    };
  }

  async getDonation(
    donationId: string,
    authToken?: string
  ): Promise<DonationStatusResponse> {
    const url = `${this.baseURL}/donations/${donationId}`;
    const headers = this.buildHeaders(authToken);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(DONATION_TIMEOUT_MS),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await this.safeJsonParse(response);
      return this.transformStatusResponse(data);
    } catch (error) {
      if (error instanceof DonationError) {
        throw error;
      }

      if (
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new DonationError(
          'Donation status request timed out',
          'api',
          'TIMEOUT_ERROR',
          0,
          { originalError: error }
        );
      }

      throw new DonationError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch donation status',
        'api',
        'NETWORK_ERROR',
        0,
        { originalError: error }
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
        signal: AbortSignal.timeout(DONATION_TIMEOUT_MS),
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

      if (
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new DonationError(
          'Donation request timed out',
          'api',
          'TIMEOUT_ERROR',
          0,
          { originalError: error }
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
