import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareRenderData } from './render/types';

import { LEADERBOARD_PAGE_LIMIT } from '@/lib/constants/leaderboard';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import {
  convertTotalRaisedToSingleCurrency,
  hasFundraiserConcluded,
} from '@/lib/utils/fundraiser';

/** Fewer public donors than this and the avatar row is left out: two initials look emptier than none. */
export const MIN_DONORS_FOR_AVATARS = 3;

/**
 * The leaderboard `limit` for everything that calls pickShareDonors: the studio, the link preview and the photo route.
 * Who gets picked depends on how many top entries it sees, so a different limit could make the photo route refuse a donor the image shows.
 * It is the page's own limit, so the page's metadata and its donor list share one request on the server. Ten top and ten recent entries are plenty for five names.
 */
export const SHARE_LEADERBOARD_LIMIT = LEADERBOARD_PAGE_LIMIT;

export interface ShareDonors {
  /** First names of public donors, top donors first, at most five. */
  names: string[];
  /** For each name: the seed of the app's generated avatar (the donation id, as the donor list uses) and the profile photo file, if any. */
  people: Array<{ seed: string; avatarFile: string | null }>;
  /** Everyone who gave, named or not. */
  count: number;
}

/** Whether a share image may name donors, with the public page's rules: the leaderboard is on, a list is shown, and it is not anonymised. */
export function showsShareDonors(fundraiser: Fundraiser): boolean {
  const settings = fundraiser.settings?.modules?.leaderboard;
  return Boolean(
    settings?.enabled &&
    (settings.show_recent_list || settings.show_top_list) &&
    !settings.anonymize
  );
}

/**
 * The donors a share image may name (see showsShareDonors).
 * Top donors come first, then recent ones, like the public page's donor strip. When the host groups the top list per donor (the default), a few people giving often do not fill the row alone.
 * Anonymous donors are left out. Only first names are used.
 */
export function pickShareDonors(
  fundraiser: Fundraiser,
  leaderboard: Pick<
    LeaderboardApiResponse,
    'recent' | 'top' | 'donorCount'
  > | null
): ShareDonors | null {
  if (!leaderboard || !showsShareDonors(fundraiser)) return null;

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
  /** The donor's own gift: "I just gave €50!", or "I give €20 every month!". The link preview leaves it out, so it never shows a gift. */
  gift?: (amount: string, frequency: DonationFrequency) => string;
}

/** A donor's completed gift, for the image and caption right after giving. `amount` is a decimal, as the API returns it. */
export interface ShareGift {
  amount: number;
  currency: string;
  frequency: DonationFrequency;
}

/** The gift's amount in the donor's own currency, which can differ from the fundraiser's. The image and the caption both use it, so they always match. */
export function formatShareGiftAmount(gift: ShareGift, locale: string): string {
  return formatCurrencyFromDecimal(gift.amount, gift.currency, locale);
}

/**
 * The name of the first active host who chose to be named.
 * Unlike the page's host list (`selectPublicHosts`), it never falls back to other hosts: the dashboard's copy of a fundraiser has private hosts too, and an image must not name one.
 */
export function getShareHostName(fundraiser: Fundraiser): string | null {
  const host = fundraiser.hosts.find(
    entry => entry.status === 'active' && entry.isPublic
  );
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
  gift = null,
  showGift = true,
}: {
  fundraiser: Fundraiser;
  locale: string;
  donors: ShareDonors | null;
  cta: string;
  url: string;
  labels: ShareLabels;
  /** The donor's completed gift. It always counts in the total, even with its line turned off. */
  gift?: ShareGift | null;
  /** Puts the gift on its own line under the amount. */
  showGift?: boolean;
}): ShareRenderData {
  const host = getShareHostName(fundraiser);
  // The page-load totals do not have the donor's own gift yet, so add it; otherwise the first donor's image still says "Be the first to give".
  const totals = { ...fundraiser.totalRaised };
  if (gift) {
    const key = gift.currency.toUpperCase();
    totals[key] = (totals[key] ?? 0) + gift.amount;
  }
  const raised = convertTotalRaisedToSingleCurrency(
    totals,
    fundraiser.currency
  );
  // Nothing raised yet: lead with the goal and invite the first gift, rather than show zeros.
  // A gift in a currency with no rate adds nothing to `raised`, but must still never sit next to the first-gift invite.
  const fresh = raised <= 0 && !gift && !hasFundraiserConcluded(fundraiser);
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
    giftLine:
      gift && showGift && labels.gift
        ? labels.gift(formatShareGiftAmount(gift, locale), gift.frequency)
        : null,
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
