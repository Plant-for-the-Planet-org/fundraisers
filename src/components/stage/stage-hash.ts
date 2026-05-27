export const STAGE_POLL_INTERVAL_MS = 15_000;
export const STAGE_POLL_INTERVAL_SECONDS = STAGE_POLL_INTERVAL_MS / 1000;

/**
 * Wall-clock bucket id used as a cache-buster and to keep the ticker
 * countdown ring synced with actual poll firings. All stage hooks
 * tick on the same bucket boundary.
 */
export function stageHash(): number {
  return Math.floor(Date.now() / STAGE_POLL_INTERVAL_MS);
}

export function msUntilNextBucket(): number {
  return STAGE_POLL_INTERVAL_MS - (Date.now() % STAGE_POLL_INTERVAL_MS);
}
