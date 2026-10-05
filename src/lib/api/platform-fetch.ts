/**
 * platformFetch — the single transport for all ForestCloud (app*.plant-for-the-planet.org) calls.
 *
 * Owns HTTP-level concerns only: base URL, auth, session id, impersonation, idempotency,
 * timeout, JSON parse. Throws PlatformAPIError on non-2xx with the parsed body attached.
 *
 * Domain concerns (response shaping, field-level error mapping, retries) live in the
 * service that calls this function.
 */

import { useImpersonationStore } from '@/stores/impersonation-store';
import { API_BASE_URL } from '../constants/app-config';
import { getSessionId } from '../utils/session-id';
import { needsTrackingId, signTrackingId } from './donation-tracking';

export type PlatformAPIErrorKind =
  | 'http' // non-2xx with parsed body
  | 'timeout' // AbortSignal.timeout fired
  | 'network'; // fetch threw (DNS, offline, CORS, etc.)

export class PlatformAPIError extends Error {
  constructor(
    public kind: PlatformAPIErrorKind,
    public status: number,
    public body: unknown,
    message?: string
  ) {
    super(message ?? `Platform ${kind} (${status})`);
    this.name = 'PlatformAPIError';
  }
}

type ManagedHeader =
  | 'X-SESSION-ID' // always from getSessionId()
  | 'Authorization' // always from opts.token
  | 'Content-Type' // auto-set from body type
  | 'Idempotency-Key' // always from opts.idempotencyKey
  | 'TRACKING-ID'; // always signed here, see ./donation-tracking

type ExtraHeaders = Record<string, string> &
  Partial<Record<ManagedHeader, never>>;

export interface PlatformFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string;
  timeoutMs?: number;
  idempotencyKey?: string;
  extraHeaders?: ExtraHeaders;
  /**
   * Skip injecting impersonation headers from the impersonation store.
   * Use when the caller is *itself* validating impersonation credentials
   * and passes the headers explicitly via extraHeaders.
   */
  skipImpersonationFromStore?: boolean;
}

export interface Impersonation {
  email: string;
  pin: string;
}

/** The headers that make a platform call run as the impersonated user. */
export function impersonationHeaders(
  impersonation: Impersonation | null | undefined
): Record<string, string> {
  if (!impersonation) return {};
  return {
    'x-switch-user': impersonation.email,
    'x-user-support-pin': impersonation.pin,
  };
}

/**
 * The impersonation in progress in this browser, or null.
 * It lives in localStorage, so on the server this is always null: our own API routes read it from the request with `readImpersonation` instead.
 */
export function getActiveImpersonation(): Impersonation | null {
  const imp = useImpersonationStore.getState();
  return imp.isActive && imp.email && imp.pin
    ? { email: imp.email, pin: imp.pin }
    : null;
}

/** The impersonation a browser forwarded to one of our API routes, so the route's platform calls run as that user too. */
export function readImpersonation(headers: Headers): Impersonation | null {
  const email = headers.get('x-switch-user')?.trim();
  const pin = headers.get('x-user-support-pin')?.trim();
  return email && pin ? { email, pin } : null;
}

export async function platformFetch<T>(
  path: string,
  opts: PlatformFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.extraHeaders as Record<string, string> | undefined),
    'X-SESSION-ID': getSessionId(),
  };

  const hasJsonBody =
    opts.body !== undefined && !(opts.body instanceof FormData);
  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }

  // Impersonation is only injected on authenticated requests by design — pin
  // must never be sent without a bearer token. Side effect: if a caller forgets
  // `token` while the user is impersonating, the call runs as the staffer, not
  // the impersonated user. Pass `token` for any endpoint that should respect
  // impersonation.
  if (opts.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;

    if (!opts.skipImpersonationFromStore) {
      Object.assign(headers, impersonationHeaders(getActiveImpersonation()));
    }
  }

  const idempotencyKey = opts.idempotencyKey?.trim();
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  let requestBody: BodyInit | undefined;
  if (opts.body !== undefined) {
    requestBody =
      opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body);
  }

  const method = opts.method ?? 'GET';
  // Signed over `requestBody` itself, the exact string handed to fetch below.
  // Re-serialising the body here would produce a different digest.
  if (
    typeof requestBody === 'string' &&
    needsTrackingId(path, method, Boolean(opts.token))
  ) {
    const trackingId = await signTrackingId(requestBody);
    if (trackingId) {
      headers['TRACKING-ID'] = trackingId;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: requestBody,
      signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
    });
  } catch (err) {
    // AbortError is unreachable today — no external signal is accepted. If opts gains an abortSignal field, this branch will fire but should map to a separate 'cancelled' kind, not 'timeout'.
    if (
      err instanceof DOMException &&
      (err.name === 'TimeoutError' || err.name === 'AbortError')
    ) {
      throw new PlatformAPIError(
        'timeout',
        0,
        null,
        `Request to ${path} timed out`
      );
    }
    throw new PlatformAPIError(
      'network',
      0,
      null,
      err instanceof Error ? err.message : 'Network request failed'
    );
  }

  if (!response.ok) {
    const body = await safeParseBody(response);
    throw new PlatformAPIError(
      'http',
      response.status,
      body,
      `Platform ${response.status} on ${path}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(text) as T;
    } catch {
      // Server claimed JSON but body is not parseable. Fall through to text.
    }
  }

  return text as unknown as T;
}

async function safeParseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  try {
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch {
    return null;
  }
}
