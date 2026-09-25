import { CDN_BASE_URL } from '@/lib/constants/app-config';
import { isAllowedImageUrl } from '@/lib/utils/image-url';

import 'server-only';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

/**
 * The only types downloaded. SVG is left out: served from our origin it could run script, and a tiny SVG can ask the server canvas for gigabytes.
 */
export const RASTER_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
];

const AWS_REGION_PATTERN = '[a-z]{2}(?:-[a-z]+)+-\\d+';

/**
 * Hosts the server may download a user-entered image from. A URL must also pass isAllowedImageUrl, so this list can only narrow what the form accepts.
 * Image services only: no catch-all like `amazonaws.com`, whose names include load balancers that resolve to private IPs.
 */
const SERVER_IMAGE_HOSTS = [
  /^(?:cdn|www-cdn)\.plant-for-the-planet\.org$/,
  /^(?:images|plus)\.unsplash\.com$/,
  /^res\.cloudinary\.com$/,
  /^[a-z0-9-]+\.imgix\.net$/,
  /^lh\d+\.googleusercontent\.com$/,
  // S3, virtual-hosted or path style: with or without a region, the old `s3-<region>` form, and dualstack.
  new RegExp(
    `^(?:[a-z0-9][a-z0-9.-]*\\.)?s3(?:[.-]${AWS_REGION_PATTERN}|\\.dualstack\\.${AWS_REGION_PATTERN})?\\.amazonaws\\.com$`
  ),
];

/** The host, with its port unless it is 443, of an https URL with no user or password. Null for anything else. */
function httpsHost(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.host;
  } catch {
    return null;
  }
}

/** The platform's own image CDN, whatever host and port it runs on in an environment: cover photos and profile pictures live there. */
const CDN_HOST = httpsHost(CDN_BASE_URL);

/** Whether the server may download an image from `url`: https on the platform CDN, or on a host on both image lists. */
export function isServerImageUrl(url: string): boolean {
  const host = httpsHost(url);
  if (!host) return false;
  if (host === CDN_HOST) return true;
  // Exact matches only: a port or a trailing dot matches nothing, so list hosts are only reached on 443.
  return (
    isAllowedImageUrl(url) &&
    SERVER_IMAGE_HOSTS.some(pattern => pattern.test(host))
  );
}

export interface FetchedImage {
  bytes: Buffer;
  type: string;
}

/** Statuses that may pass on a later try. Anything else, such as a 404, fails the same way next time. */
function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
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
 * Downloads an image the server may use, from the platform CDN or a host on the server's image list only.
 * Redirects are followed by hand, a few at most, and each hop is checked against the list again, so a trusted host cannot bounce the request anywhere else.
 * The body is read up to a size cap and the type must be a raster image. Its pixel size is not checked here: see fitsDecodeBudget before decoding it.
 * `onTransientFailure` hears of a failure that may pass on a later try (network, timeout, 408, 429, 5xx), as opposed to a refusal that never will.
 */
export async function fetchAllowedImage(
  url: string,
  {
    maxBytes = MAX_BYTES,
    onTransientFailure,
  }: { maxBytes?: number; onTransientFailure?: () => void } = {}
): Promise<FetchedImage | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isServerImageUrl(current)) return null;
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => null);
    if (!response) {
      onTransientFailure?.();
      return null;
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok) {
      if (isTransientStatus(response.status)) onTransientFailure?.();
      return null;
    }
    const type = (response.headers.get('content-type') ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (!RASTER_IMAGE_TYPES.includes(type)) return null;
    const bytes = await readCapped(response, maxBytes).catch(error => {
      onTransientFailure?.();
      throw error;
    });
    return bytes ? { bytes, type } : null;
  }
  return null;
}
