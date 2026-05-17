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

export interface PlatformFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string;
  timeoutMs?: number;
  idempotencyKey?: string;
  extraHeaders?: Record<string, string>;
  /**
   * Skip injecting impersonation headers from the impersonation store.
   * Use when the caller is *itself* validating impersonation credentials
   * and passes the headers explicitly via extraHeaders.
   */
  skipImpersonationFromStore?: boolean;
}

export async function platformFetch<T>(
  path: string,
  opts: PlatformFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'X-SESSION-ID': getSessionId(),
    ...opts.extraHeaders,
  };

  const hasBody = opts.body !== undefined && !(opts.body instanceof FormData);
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

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

  if (opts.idempotencyKey) {
    headers['Idempotency-Key'] = opts.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: hasBody
        ? opts.body instanceof FormData
          ? opts.body
          : JSON.stringify(opts.body)
        : undefined,
      signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
    });
  } catch (err) {
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

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return (await response.text()) as unknown as T;
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
