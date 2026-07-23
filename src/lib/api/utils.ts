/**
 * Retry `fn` with backoff (1s, 2s, 4s, ...), up to `maxRetries` times.
 *
 * Notes for future callers:
 * - Currently retries on every error, even 4xx, for simplicity. A 400/404/422 will never pass on retry, so it only adds delay. Fine for today's callers (all GET reads). If this ever runs on a high-traffic path, retry transient errors only (network / timeout / 5xx / 429).
 * - Safe for GETs only. Don't wrap a POST unless it sends an Idempotency-Key (see platformFetch): a retried timeout can repeat a write the server already ran.
 * - Defaults to 2 retries. A negative value is clamped to 0 (one attempt, no retry).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  const maxRetriesValidated = Math.max(0, maxRetries);
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetriesValidated; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt === maxRetriesValidated) break;
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw lastError!;
}
