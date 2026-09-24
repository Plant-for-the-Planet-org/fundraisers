/**
 * Where one page of an oldest-first list sits in a newest-first API.
 *
 * The leaderboard only lists newest first. Oldest-first page N is the matching stretch counted from the end, which falls across at most two API pages. Fetch `apiPages`, join them, slice with `start`/`end`, then reverse.
 */
export function getReversedPageWindow(
  total: number,
  page: number,
  pageSize: number
): { apiPages: number[]; start: number; end: number } | null {
  // Zero-based positions in the newest-first list.
  const endIndex = total - (page - 1) * pageSize;
  if (endIndex <= 0) return null;
  const startIndex = Math.max(0, endIndex - pageSize);

  const firstApiPage = Math.floor(startIndex / pageSize) + 1;
  const lastApiPage = Math.floor((endIndex - 1) / pageSize) + 1;
  const offset = (firstApiPage - 1) * pageSize;

  const apiPages: number[] = [];
  for (let p = firstApiPage; p <= lastApiPage; p++) apiPages.push(p);

  return { apiPages, start: startIndex - offset, end: endIndex - offset };
}
