import { platformFetch } from './platform-fetch';

const CONFIG_TIMEOUT = 4000;

/**
 * `GET /config` on the platform. Unauthenticated, and geolocated from the caller's IP.
 * Only the fields we use are typed; the response also carries CDN paths and app versions.
 */
export interface PlatformConfig {
  country?: string;
  currency?: string;
  clientIp?: string;
  loc?: {
    countryCode?: string;
    city?: string;
    postalCode?: string;
    timezone?: string;
  };
}

// The caller's IP does not change within a session, so one lookup is enough.
// This holds the promise rather than the result, so callers that arrive while the request is still open share it instead of starting a second one.
let inFlight: Promise<PlatformConfig | null> | null = null;

export function getPlatformConfig(): Promise<PlatformConfig | null> {
  if (!inFlight) {
    inFlight = requestConfig();
  }

  return inFlight;
}

async function requestConfig(): Promise<PlatformConfig | null> {
  try {
    return await platformFetch<PlatformConfig>('/config', {
      timeoutMs: CONFIG_TIMEOUT,
    });
  } catch (error) {
    // Nothing here is essential; every caller has a fallback. Drop the cached promise so the next caller retries instead of inheriting this failure for the life of the page.
    console.warn('Platform /config failed:', error);
    inFlight = null;
    return null;
  }
}

/** Test seam. Production code never needs this: the config is stable for the life of the page. */
export function resetPlatformConfigCache() {
  inFlight = null;
}
