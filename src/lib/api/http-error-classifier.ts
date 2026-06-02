export type ErrorType = 'validation' | 'api' | 'business' | 'user';

const STATUS_MAP: Record<number, { type: ErrorType; code: string }> = {
  400: { type: 'validation', code: 'VALIDATION_ERROR' },
  401: { type: 'user', code: 'AUTH_ERROR' },
  403: { type: 'user', code: 'ACCESS_DENIED' },
  422: { type: 'business', code: 'BUSINESS_LOGIC_ERROR' },
  429: { type: 'api', code: 'RATE_LIMIT_ERROR' },
  500: { type: 'api', code: 'SERVER_ERROR' },
  502: { type: 'api', code: 'SERVER_ERROR' },
  503: { type: 'api', code: 'SERVER_ERROR' },
  504: { type: 'api', code: 'SERVER_ERROR' },
};

/**
 * Map an HTTP status to a domain (type, code) classification.
 * Used by services to translate a PlatformAPIError into their own domain error.
 */
export function classifyPlatformError(status: number): {
  type: ErrorType;
  code: string;
} {
  return STATUS_MAP[status] ?? { type: 'api', code: 'HTTP_ERROR' };
}
