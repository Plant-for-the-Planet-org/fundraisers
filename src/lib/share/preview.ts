/**
 * The link preview image URL for a fundraiser page.
 * `version` is `shareImageVersion` (server), so the URL changes only when the image would, and each URL can be cached for good.
 */
export function shareImagePath(
  slug: string,
  locale: string,
  version: string
): string {
  return `/api/share-image/${encodeURIComponent(slug)}?${new URLSearchParams({ l: locale, v: version })}`;
}
