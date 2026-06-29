import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';

/**
 * Clamps `tab` to a list that is actually enabled in `settings`.
 * If the requested tab is disabled, falls back to the other one.
 * Used in LeaderboardView, ViewAllOverlay, and DonorsSummaryPanel so
 * the precedence rule lives in exactly one place.
 */
export function resolveActiveTab(
  tab: 'recent' | 'top',
  settings: Pick<
    LeaderboardModuleSettings,
    'show_recent_list' | 'show_top_list'
  >
): 'recent' | 'top' {
  if (tab === 'recent' && !settings.show_recent_list) return 'top';
  if (tab === 'top' && !settings.show_top_list) return 'recent';
  return tab;
}
