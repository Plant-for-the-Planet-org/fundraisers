export type UmamiConfig = {
  src: string;
  /**
   * Umami's recorder, which we run for heatmaps. It needs the session token the main
   * tracker gets back, so it is never loaded on its own.
   */
  recorderSrc: string;
  websiteId: string;
  /** Repeats the host check inside the tracker, which refuses to send from elsewhere. */
  domains?: string;
};

export type ResolveUmamiConfigInput = {
  /** Instance origin, or a same-origin path if the scripts are ever proxied. */
  baseUrl: string | undefined;
  websiteId: string | undefined;
  productionHost: string | undefined;
  isProduction: boolean;
  pathname: string;
};

// Auth hand-off paths carry an OAuth `state` nonce and a `redirectTo` in the query
// string, and Umami stores the full URL. Nothing here is worth measuring anyway.
const UNTRACKED_PATH_PREFIXES = ['/login', '/redirecting'];

/**
 * Stage Mode runs unattended on a projector for hours. Counting it would drown the
 * real visitor numbers in one long-lived page load.
 */
const UNTRACKED_PATH_SUFFIX = '/stage';

export function isTrackedPath(pathname: string): boolean {
  if (pathname.endsWith(UNTRACKED_PATH_SUFFIX)) return false;

  return !UNTRACKED_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Decides whether to load the Umami tracker and its recorder.
 *
 * There is one website, the production one, so nothing reports from anywhere but
 * NEXT_PUBLIC_APP_HOST. Returns null when analytics should stay off: no instance
 * configured (the default locally), a non-production host, or an untracked path.
 */
export function resolveUmamiConfig({
  baseUrl,
  websiteId,
  productionHost,
  isProduction,
  pathname,
}: ResolveUmamiConfigInput): UmamiConfig | null {
  const base = baseUrl?.trim().replace(/\/+$/, '');
  if (!base || !websiteId) return null;
  if (!isProduction) return null;
  if (!isTrackedPath(pathname)) return null;

  return {
    src: `${base}/script.js`,
    recorderSrc: `${base}/recorder.js`,
    websiteId,
    ...(productionHost ? { domains: productionHost } : {}),
  };
}
