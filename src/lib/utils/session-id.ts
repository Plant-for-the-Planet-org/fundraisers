let cached: string | undefined;

// 48 bits of entropy as 12 hex chars — at 1M concurrent sessions, the
// collision probability is ~3 in a billion. Plenty for log correlation,
// half the wire cost of a UUID.
function randomId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * In-memory session ID for the X-SESSION-ID header.
 *
 * Why: a stable per-tab identifier lets the platform API correlate logs
 * and apply per-client rate limits without persisting anything to the
 * device — no localStorage, no cookie, no consent surface. The ID dies
 * with the JS runtime (full page reload generates a new one).
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'frr_ssr';
  if (!cached) cached = `frr_${randomId()}`;
  return cached;
}
