import type { InsightsReferral } from '@/lib/types/fundraiser-insights';

const TOP_REFERRALS = 6;

/** Visits and donations per share code, combined, the codes that brought donations first. */
export function mergeReferrals(
  visits: Record<string, number>,
  donations: Record<string, number>
): InsightsReferral[] {
  return [...new Set([...Object.keys(visits), ...Object.keys(donations)])]
    .map(ref => ({
      ref,
      visits: visits[ref] ?? 0,
      donations: donations[ref] ?? 0,
    }))
    .sort((a, b) => b.donations - a.donations || b.visits - a.visits)
    .slice(0, TOP_REFERRALS);
}
