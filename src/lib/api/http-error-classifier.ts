import { PlatformAPIError } from './platform-fetch';

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

/**
 * The sentence the platform wrote for this refusal, when it wrote one.
 *
 * The platform's error body carries a `message` only where the code raising it chose to explain itself to a person: "Publish it first, then invite", "You have sent 20 invitations in the last 24 hours". Those are worth showing verbatim, because a status code cannot tell three different refusals apart -- they all arrive as 409 with the same `state_conflict` code, and only the sentence says which one happened.
 *
 * Where the platform wrote nothing, this returns null and the caller falls back to its own copy. Refusals raised as validation failures are that case: their text sits under `parameters.errors` and reads like an assertion rather than something to show somebody.
 *
 * The one cost is language. These sentences come from the platform in English regardless of who is reading, so a German user sees English here. Better than a wrong message, worse than a translated one, and it stays that way until each refusal gets its own error code to translate against.
 */
export function platformUserMessage(error: unknown): string | null {
  if (!(error instanceof PlatformAPIError)) return null;

  const body = error.body;
  if (typeof body !== 'object' || body === null) return null;

  const message = (body as { message?: unknown }).message;

  return typeof message === 'string' && message.trim() !== ''
    ? message.trim()
    : null;
}
