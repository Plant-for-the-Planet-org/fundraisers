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
  | 'Idempotency-Key'; // always from opts.idempotencyKey

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

export interface PlatformResponse<T> {
  /** HTTP status of a successful (2xx) response. */
  status: number;
  /** Parsed body, or `undefined` for 204 / empty-body responses. */
  data: T | undefined;
}

async function performPlatformRequest<T>(
  path: string,
  opts: PlatformFetchOptions = {}
): Promise<PlatformResponse<T>> {
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
      const imp = useImpersonationStore.getState();
      if (imp.isActive && imp.email && imp.pin) {
        headers['x-switch-user'] = imp.email;
        headers['x-user-support-pin'] = imp.pin;
      }
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? 'GET',
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
    return { status: 204, data: undefined };
  }

  const text = await response.text();
  if (!text) {
    return { status: response.status, data: undefined };
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      return { status: response.status, data: JSON.parse(text) as T };
    } catch {
      // Server claimed JSON but body is not parseable. Fall through to text.
    }
  }

  return { status: response.status, data: text as unknown as T };
}

/**
 * Returns the parsed body only (or `undefined` for 204 / empty responses).
 * This is the common case. Use `platformFetchWithResponse` when the caller
 * needs the HTTP status to disambiguate success shapes (e.g. 200 vs 204).
 */
export async function platformFetch<T>(
  path: string,
  opts: PlatformFetchOptions = {}
): Promise<T> {
  const { data } = await performPlatformRequest<T>(path, opts);
  return data as T;
}

/**
 * Like `platformFetch`, but also returns the HTTP status. Needed when two
 * success codes mean different things and the body alone can't tell them
 * apart — a 200 with an empty body is indistinguishable from a 204 otherwise.
 */
export function platformFetchWithResponse<T>(
  path: string,
  opts: PlatformFetchOptions = {}
): Promise<PlatformResponse<T>> {
  return performPlatformRequest<T>(path, opts);
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
