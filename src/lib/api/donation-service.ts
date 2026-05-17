import type {
  DonationPayload,
  DonationResponse,
  DonationStatusResponse,
} from '../types/donation';
import type { ErrorType } from './http-error-classifier';

import { classifyPlatformError } from './http-error-classifier';
import { PlatformAPIError, platformFetch } from './platform-fetch';

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

function toDonationError(err: unknown, timeoutMessage: string): DonationError {
  if (err instanceof DonationError) return err;

  if (err instanceof PlatformAPIError) {
    if (err.kind === 'timeout') {
      return new DonationError(timeoutMessage, 'api', 'TIMEOUT_ERROR', 0, {
        originalError: err,
      });
    }
    if (err.kind === 'network') {
      return new DonationError(err.message, 'api', 'NETWORK_ERROR', 0, {
        originalError: err,
      });
    }
    const { type, code } = classifyPlatformError(err.status);
    const details: Record<string, unknown> = { body: err.body };
    // Preserve field-level errors for validation/business statuses
    if (
      (err.status === 400 || err.status === 422) &&
      err.body &&
      typeof err.body === 'object' &&
      'errors' in err.body
    ) {
      details.errors = (err.body as { errors: unknown }).errors;
    }
    return new DonationError(err.message, type, code, err.status, details);
  }

  return new DonationError(
    err instanceof Error ? err.message : 'Donation request failed',
    'api',
    'NETWORK_ERROR',
    0,
    { originalError: err }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformResponse(data: any): DonationResponse {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformStatusResponse(data: any): DonationStatusResponse {
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

export class DonationService {
  async getDonation(
    donationId: string,
    authToken?: string
  ): Promise<DonationStatusResponse> {
    try {
      const data = await platformFetch<unknown>(`/donations/${donationId}`, {
        method: 'GET',
        token: authToken,
        timeoutMs: DONATION_TIMEOUT_MS,
      });
      return transformStatusResponse(data);
    } catch (err) {
      throw toDonationError(err, 'Donation status request timed out');
    }
  }

  async createDonation(
    payload: DonationPayload,
    authToken?: string,
    idempotencyKey?: string
  ): Promise<DonationResponse> {
    try {
      const data = await platformFetch<unknown>('/donations', {
        method: 'POST',
        body: payload,
        token: authToken,
        idempotencyKey,
        timeoutMs: DONATION_TIMEOUT_MS,
      });
      return transformResponse(data);
    } catch (err) {
      throw toDonationError(err, 'Donation request timed out');
    }
  }
}

export const donationService = new DonationService();
