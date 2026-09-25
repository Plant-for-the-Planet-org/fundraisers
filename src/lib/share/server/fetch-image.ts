import { CDN_BASE_URL } from '@/lib/constants/app-config';
import { isAllowedImageUrl } from '@/lib/utils/image-url';

import 'server-only';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

/** Types we pass on to a browser. SVG is left out: served from our origin it could run script. */
export const RASTER_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
];
const SVG_TYPE = 'image/svg+xml';

/** The platform's own image CDN: cover photos and profile pictures live there, whatever host it runs on in an environment. */
function isPlatformCdnUrl(url: string): boolean {
  try {
    const target = new URL(url);
    const cdn = new URL(CDN_BASE_URL);
    return target.protocol === 'https:' && target.host === cdn.host;
  } catch {
    return false;
  }
}

export interface FetchedImage {
  bytes: Buffer;
  type: string;
}

async function readCapped(
  response: Response,
  maxBytes: number
): Promise<Buffer | null> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Downloads an image the server may use, from a host on the image allowlist only.
 * Redirects are followed by hand, a few at most, and each hop is checked against the allowlist again, so a trusted host cannot bounce the request anywhere else.
 * The body is read up to a size cap and the type must be an image; SVG only when `allowSvg`, for drawing on the server canvas, never for relaying to a browser.
 */
export async function fetchAllowedImage(
  url: string,
  { allowSvg = false, maxBytes = MAX_BYTES } = {}
): Promise<FetchedImage | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // isAllowedImageUrl treats an empty value as "nothing to check"; here it means nothing to fetch.
    if (!current || !(isPlatformCdnUrl(current) || isAllowedImageUrl(current)))
      return null;
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => null);
    if (!response) return null;
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok) return null;
    const type = (response.headers.get('content-type') ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const allowed =
      RASTER_IMAGE_TYPES.includes(type) || (allowSvg && type === SVG_TYPE);
    if (!allowed) return null;
    const bytes = await readCapped(response, maxBytes);
    return bytes ? { bytes, type } : null;
  }
  return null;
}
