/** How often the link preview is redrawn with new numbers. */
export const SHARE_PREVIEW_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * The link preview image URL for a fundraiser page.
 * `v` changes every window, so a crawler that caches images by URL (LinkedIn, Facebook, X) fetches fresh numbers the next time it reads the page.
 */
export function shareImagePath(
  slug: string,
  locale: string,
  now = Date.now()
): string {
  const version = Math.floor(now / SHARE_PREVIEW_WINDOW_MS);
  return `/api/share-image/${encodeURIComponent(slug)}?${new URLSearchParams({ l: locale, v: String(version) })}`;
}
