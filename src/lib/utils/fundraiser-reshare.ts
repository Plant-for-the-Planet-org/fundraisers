import type { ShareDonorProgress } from '@/lib/share/share-data';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { isDonorRefreshMoment, showsGoal } from '@/lib/share/share-data';
import {
  convertTotalRaisedToSingleCurrency,
  hasFundraiserConcluded,
} from './fundraiser';

/** The share of the goal that counts as a milestone. Reaching the goal itself is its own moment. */
export const PROGRESS_MILESTONES = [25, 50, 75] as const;

/**
 * How many points past a milestone it still counts as news.
 * A host is reminded while the news is fresh, and the reminder goes by itself as the fundraiser moves on, so nothing has to be stored to know whether they acted on it.
 */
export const MILESTONE_WINDOW = 10;

export type ReshareMoment =
  | { kind: 'goal' }
  | { kind: 'progress'; percent: (typeof PROGRESS_MILESTONES)[number] }
  | { kind: 'donors'; count: number };

/** The share of the goal raised so far, not rounded; null when there is no goal to measure against. */
export function getRaisedPercent(fundraiser: Fundraiser): number | null {
  if (fundraiser.goalAmount <= 0) return null;
  const raised = convertTotalRaisedToSingleCurrency(
    fundraiser.totalRaised,
    fundraiser.currency
  );
  return (raised / fundraiser.goalAmount) * 100;
}

/**
 * The moment when a host has fresh news to share again, if there is one, so a fundraiser keeps being reshared as it moves.
 * In order of weight: the goal reached, a milestone passed, the first donors who can be named.
 * Nothing for a fundraiser that cannot take gifts: there is nothing to invite people to.
 */
export function getReshareMoment(
  fundraiser: Fundraiser,
  donorProgress: ShareDonorProgress | null
): ReshareMoment | null {
  if (!fundraiser.canDonate || hasFundraiserConcluded(fundraiser)) return null;

  // The images show no progress when the goal is hidden, so there is no progress news to share either.
  const percent = showsGoal(fundraiser) ? getRaisedPercent(fundraiser) : null;
  if (percent !== null) {
    if (percent >= 100 && percent < 100 + 2 * MILESTONE_WINDOW)
      return { kind: 'goal' };
    const milestone = [...PROGRESS_MILESTONES]
      .reverse()
      .find(m => percent >= m && percent < m + MILESTONE_WINDOW);
    if (milestone) return { kind: 'progress', percent: milestone };
  }
  return isDonorRefreshMoment(donorProgress)
    ? { kind: 'donors', count: donorProgress!.total }
    : null;
}
