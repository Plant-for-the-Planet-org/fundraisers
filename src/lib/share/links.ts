/** The query parameter a personal share link carries. */
export const REF_PARAM = 'ref';

/** The shape of a platform code. The check only drops malformed values. It does not prove who owns a code, so a hand-typed `?ref=` in this shape still counts. */
const REF_CODE = /^[A-Za-z0-9_-]{4,32}$/;

export function isValidRefCode(
  value: string | null | undefined
): value is string {
  return typeof value === 'string' && REF_CODE.test(value);
}

/**
 * A fundraiser link tagged for one channel, and for one person when `ref` is set.
 * The tags tell Insights which channel, and whose share, brought a visit.
 */
export function buildShareUrl({
  origin,
  slug,
  source,
  medium,
  ref,
}: {
  origin: string;
  slug: string;
  source?: string;
  medium?: string;
  ref?: string | null;
}): string {
  const url = new URL(`/raise/${encodeURIComponent(slug)}`, origin);
  if (source) url.searchParams.set('utm_source', source);
  if (medium) url.searchParams.set('utm_medium', medium);
  if (isValidRefCode(ref)) url.searchParams.set(REF_PARAM, ref);
  return url.toString();
}

/** The link as shown on an image: no protocol, no tags. */
export function displayUrl(origin: string, slug: string): string {
  return `${new URL(origin).host}/raise/${slug}`;
}
