import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareRenderData } from './render/types';

import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import {
  convertTotalRaisedToSingleCurrency,
  hasFundraiserConcluded,
} from '@/lib/utils/fundraiser';
import { selectPublicHosts } from '@/lib/utils/fundraiser-hosts';

/** Fewer public donors than this and the avatar row is left out: two initials look emptier than none. */
export const MIN_DONORS_FOR_AVATARS = 3;

export interface ShareDonors {
  /** First names of public donors, top donors first, at most five. */
  names: string[];
  /** For each name: the seed of the app's generated avatar (the donation id, as the donor list uses) and the profile photo file, if any. */
  people: Array<{ seed: string; avatarFile: string | null }>;
  /** Everyone who gave, named or not. */
  count: number;
}

/**
 * The donors a share image may name, following the same rules as the public page: the leaderboard must be on and shown, and not anonymised.
 * Top donors come first, then recent ones, like the public page's donor strip. The top list is grouped per person, so a few people giving often do not fill the row alone.
 * Anonymous donors are left out. Only first names are used.
 */
export function pickShareDonors(
  fundraiser: Fundraiser,
  leaderboard: Pick<
    LeaderboardApiResponse,
    'recent' | 'top' | 'donorCount'
  > | null
): ShareDonors | null {
  const settings = fundraiser.settings?.modules?.leaderboard;
  const shown =
    settings?.enabled && (settings.show_recent_list || settings.show_top_list);
  if (!leaderboard || !shown || settings.anonymize) return null;

  const names: string[] = [];
  const people: ShareDonors['people'] = [];
  for (const donation of [...(leaderboard.top ?? []), ...leaderboard.recent]) {
    if (donation.isAnonymous) continue;
    const first = donation.donorName.trim().split(/\s+/)[0];
    if (!first || names.includes(first)) continue;
    names.push(first);
    people.push({ seed: donation.id, avatarFile: donation.avatarUrl ?? null });
    if (names.length === 5) break;
  }
  if (
    names.length < MIN_DONORS_FOR_AVATARS ||
    leaderboard.donorCount < MIN_DONORS_FOR_AVATARS
  ) {
    return null;
  }
  return { names, people, count: leaderboard.donorCount };
}

export interface ShareLabels {
  byLine: (host: string) => string;
  raisedOf: (raised: string, goal: string) => string;
  raised: (raised: string) => string;
  /** "Anna, Ben and 46 others have given". */
  given: (first: string, second: string, others: number) => string;
  /** Before anyone has given: "Goal: €500,000", or "Just getting started" without a goal. */
  goal: (goal: string) => string;
  started: () => string;
  /** "Be the first to give". */
  first: () => string;
  /** The ring's badge before anyone has given, such as "New". */
  newBadge: () => string;
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
  const raised = convertTotalRaisedToSingleCurrency(
    fundraiser.totalRaised,
    fundraiser.currency
  );
  // Nothing raised yet: lead with the goal and invite the first gift, rather than show zeros.
  const fresh = raised <= 0 && !hasFundraiserConcluded(fundraiser);
  return {
    name: fundraiser.title,
    byLine: host ? labels.byLine(host) : '',
    raised,
    goal: showsGoal(fundraiser) ? fundraiser.goalAmount : null,
    formatMoney: amount =>
      formatCurrencyFromDecimal(
        Math.round(amount),
        fundraiser.currency,
        locale
      ),
    raisedLine: (raisedText, goal) =>
      fresh
        ? goal
          ? labels.goal(goal)
          : labels.started()
        : goal
          ? labels.raisedOf(raisedText, goal)
          : labels.raised(raisedText),
    donors: donors?.names ?? [],
    concluded: hasFundraiserConcluded(fundraiser),
    firstLine: fresh && !donors ? labels.first() : null,
    badge: fresh ? labels.newBadge() : null,
    donorsLine: donors
      ? labels.given(donors.names[0], donors.names[1], donors.count - 2)
      : null,
    cta,
    url,
  };
}
