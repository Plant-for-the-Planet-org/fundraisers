export type ErrorType = 'validation' | 'api' | 'business' | 'user';

export interface HttpErrorClassification {
  type: ErrorType;
  code: string;
  debugMessage: string; // For logging/Sentry only
  status: number;
  errorData: unknown;
}

const STATUS_MAP: Record<number, { type: ErrorType; code: string }> = {
  400: { type: 'validation', code: 'VALIDATION_ERROR' },
  401: {
    type: 'user',
    code: 'AUTH_ERROR',
  },
  403: { type: 'user', code: 'ACCESS_DENIED' },
  422: { type: 'business', code: 'BUSINESS_LOGIC_ERROR' },
  429: {
    type: 'api',
    code: 'RATE_LIMIT_ERROR',
  },
  500: {
    type: 'api',
    code: 'SERVER_ERROR',
  },
  502: {
    type: 'api',
    code: 'SERVER_ERROR',
  },
  503: {
    type: 'api',
    code: 'SERVER_ERROR',
  },
  504: {
    type: 'api',
    code: 'SERVER_ERROR',
  },
};

/**
 * Parse the response body and classify an HTTP error by status code.
 * Each service layer can use the returned classification to construct
 * its own domain-specific error (DonationError, PaymentError, etc.).
 */
export async function classifyHttpError(
  response: Response
): Promise<HttpErrorClassification> {
  let errorData: unknown;

  try {
    errorData = await response.json();
  } catch {
    // Response is not JSON
  }

  const entry = STATUS_MAP[response.status];
  const debugMessage = `HTTP ${response.status}: ${response.statusText}`;

  if (entry) {
    return {
      type: entry.type,
      code: entry.code,
      debugMessage,
      status: response.status,
      errorData,
    };
  }

  return {
    type: 'api',
    code: 'HTTP_ERROR',
    debugMessage,
    status: response.status,
    errorData,
  };
}
