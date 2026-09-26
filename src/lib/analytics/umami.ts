export const DEFAULT_UMAMI_URL = 'https://insights.startplanting.org';

/** The Umami instance origin, for both the tracker and the stats. Uses ours when `NEXT_PUBLIC_UMAMI_URL` is unset or empty. */
export function getUmamiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_UMAMI_URL?.trim() || DEFAULT_UMAMI_URL
  ).replace(/\/+$/, '');
}

export type UmamiConfig = {
  src: string;
  /**
   * Umami's recorder, which we run for heatmaps. It needs the session token the main
   * tracker gets back, so it is never loaded on its own.
   */
  recorderSrc: string;
  websiteId: string;
};

export type ResolveUmamiConfigInput = {
  /** Instance origin, or a same-origin path if the scripts are ever proxied. */
  baseUrl: string | undefined;
  websiteId: string | undefined;
  pathname: string;
  /** The `COLLECT_INSIGHTS` env value. On unless it is set to false (or 0, off, no). */
  collectInsights?: string | undefined;
};

/**
 * Whether this box sends visits and events to Umami. On by default wherever Umami is configured; `COLLECT_INSIGHTS=false` turns it off (for example locally) while the dashboard Insights, which only read stats, keep working.
 */
export function isCollectingInsights(value: string | undefined): boolean {
  if (value === undefined) return true;
  return !['off', 'false', '0', 'no'].includes(value.trim().toLowerCase());
}

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
 * Reports from any host the env vars are set on, so a preview or staging box can point at its own Umami website for testing.
 * Returns null when analytics should stay off: collection switched off, no instance configured (the default locally), or an untracked path.
 */
export function resolveUmamiConfig({
  baseUrl,
  websiteId,
  pathname,
  collectInsights,
}: ResolveUmamiConfigInput): UmamiConfig | null {
  if (!isCollectingInsights(collectInsights)) return null;
  const base = baseUrl?.trim().replace(/\/+$/, '');
  const id = websiteId?.trim();
  if (!base || !id) return null;
  if (!isTrackedPath(pathname)) return null;

  return {
    src: `${base}/script.js`,
    recorderSrc: `${base}/recorder.js`,
    websiteId: id,
  };
}
