import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareRenderData } from './render/types';

import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { convertTotalRaisedToSingleCurrency } from '@/lib/utils/fundraiser';
import { selectPublicHosts } from '@/lib/utils/fundraiser-hosts';

/** Fewer public donors than this and the avatar row is left out: two initials look emptier than none. */
export const MIN_DONORS_FOR_AVATARS = 3;

export interface ShareDonors {
  /** First names of public donors, newest first, at most five. */
  names: string[];
  /** Everyone who gave, named or not. */
  count: number;
}

/**
 * The donors a share image may name, following the same rules as the public page: the leaderboard must be on and shown, and not anonymised.
 * Anonymous donors are left out. Only first names are used.
 */
export function pickShareDonors(
  fundraiser: Fundraiser,
  leaderboard: Pick<LeaderboardApiResponse, 'recent' | 'donorCount'> | null
): ShareDonors | null {
  const settings = fundraiser.settings?.modules?.leaderboard;
  const shown =
    settings?.enabled && (settings.show_recent_list || settings.show_top_list);
  if (!leaderboard || !shown || settings.anonymize) return null;

  const names: string[] = [];
  for (const donation of leaderboard.recent) {
    if (donation.isAnonymous) continue;
    const first = donation.donorName.trim().split(/\s+/)[0];
    if (first && !names.includes(first)) names.push(first);
    if (names.length === 5) break;
  }
  if (
    names.length < MIN_DONORS_FOR_AVATARS ||
    leaderboard.donorCount < MIN_DONORS_FOR_AVATARS
  ) {
    return null;
  }
  return { names, count: leaderboard.donorCount };
}

export interface ShareLabels {
  byLine: (host: string) => string;
  raisedOf: (raised: string, goal: string) => string;
  raised: (raised: string) => string;
  /** "Anna, Ben and 46 others have joined". */
  joined: (first: string, second: string, others: number) => string;
}

/** The first public host's name, as the public page shows it. */
export function getShareHostName(fundraiser: Fundraiser): string | null {
  const host = selectPublicHosts(fundraiser.hosts)[0];
  return host?.displayName ?? host?.user?.name ?? null;
}

/** Whether the fundraiser shows its goal: the same setting the public page reads. */
export function showsGoal(fundraiser: Fundraiser): boolean {
  return (
    fundraiser.goalAmount > 0 &&
    (fundraiser.settings?.modules?.donor_score?.show_goal ?? true)
  );
}

export function buildShareRenderData({
  fundraiser,
  locale,
  donors,
  cta,
  url,
  labels,
}: {
  fundraiser: Fundraiser;
  locale: string;
  donors: ShareDonors | null;
  cta: string;
  url: string;
  labels: ShareLabels;
}): ShareRenderData {
  const host = getShareHostName(fundraiser);
  return {
    name: fundraiser.title,
    byLine: host ? labels.byLine(host) : '',
    raised: convertTotalRaisedToSingleCurrency(
      fundraiser.totalRaised,
      fundraiser.currency
    ),
    goal: showsGoal(fundraiser) ? fundraiser.goalAmount : null,
    formatMoney: amount =>
      formatCurrencyFromDecimal(
        Math.round(amount),
        fundraiser.currency,
        locale
      ),
    raisedLine: (raised, goal) =>
      goal ? labels.raisedOf(raised, goal) : labels.raised(raised),
    donors: donors?.names ?? [],
    joinedLine: donors
      ? labels.joined(donors.names[0], donors.names[1], donors.count - 2)
      : null,
    cta,
    url,
  };
}
