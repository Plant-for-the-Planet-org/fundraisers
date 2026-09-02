/**
 * `TRACKING-ID`: an HMAC-SHA256 of the exact request body, required by the platform on
 * anonymous donation requests. Without it the donation is not created, and the failure
 * surfaces later as a payment error rather than at the point of request, so a missing
 * or wrong header is easy to miss.
 *
 * Authenticated requests do not need it.
 *
 * Configured through NEXT_PUBLIC_TRACKING_KEY. Notes on that choice, and on moving the
 * signing server-side, are in the internal thread linked from PR #349.
 */

/** Only the donation create/update calls are checked, and only unauthenticated ones. */
export function needsTrackingId(
  path: string,
  method: string,
  hasToken: boolean
): boolean {
  if (hasToken) return false;
  if (method !== 'POST' && method !== 'PUT') return false;

  return path === '/donations' || path.startsWith('/donations/');
}

/**
 * Signs the serialised body. Returns null when no key is configured, which is the
 * local default.
 *
 * Throws when a key is configured but signing is impossible, rather than sending an
 * unsigned request. An unsigned request would not create the donation, so a visible
 * failure is the lesser harm.
 */
export async function signTrackingId(body: string): Promise<string | null> {
  const trackingKey = process.env.NEXT_PUBLIC_TRACKING_KEY;
  if (!trackingKey) return null;

  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'TRACKING-ID cannot be signed: Web Crypto is unavailable. Refusing to send an unsigned donation request.'
    );
  }

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(trackingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
