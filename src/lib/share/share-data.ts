import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareCardId, ShareRenderData } from './render/types';

import { LEADERBOARD_PAGE_LIMIT } from '@/lib/constants/leaderboard';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import {
  convertTotalRaisedToSingleCurrency,
  hasFundraiserConcluded,
  isGoalSectionShown,
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
type ShareLeaderboard = Pick<
  LeaderboardApiResponse,
  'recent' | 'top' | 'donorCount'
>;

/** The first names of up to five public donors, top donors first, with what the image needs to draw their avatars. */
function collectShareDonors(leaderboard: ShareLeaderboard) {
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
  return { names, people };
}

export function pickShareDonors(
  fundraiser: Fundraiser,
  leaderboard: ShareLeaderboard | null
): ShareDonors | null {
  if (!leaderboard || !showsShareDonors(fundraiser)) return null;

  const { names, people } = collectShareDonors(leaderboard);
  if (
    names.length < MIN_DONORS_FOR_AVATARS ||
    leaderboard.donorCount < MIN_DONORS_FOR_AVATARS
  ) {
    return null;
  }
  return { names, people, count: leaderboard.donorCount };
}

/**
 * Where a fundraiser stands on showing its donors, so the dashboard can explain it and say when it is time to refresh the story:
 * - `off`: the page's own rules hide donors (the leaderboard is off, shows no list, or is anonymised), which only the host can change;
 * - `few`: fewer than three public donors so far, which only time changes (`count` is how many);
 * - `ready`: a story may name them.
 * `total` is everyone who gave, named or not.
 */
export interface ShareDonorProgress {
  status: 'off' | 'few' | 'ready';
  count: number;
  total: number;
}

export function getShareDonorProgress(
  fundraiser: Fundraiser,
  leaderboard: ShareLeaderboard | null
): ShareDonorProgress {
  const total = leaderboard?.donorCount ?? 0;
  if (!showsShareDonors(fundraiser)) return { status: 'off', count: 0, total };
  const count = leaderboard
    ? Math.min(collectShareDonors(leaderboard).names.length, total)
    : 0;
  return {
    status: count >= MIN_DONORS_FOR_AVATARS ? 'ready' : 'few',
    count,
    total,
  };
}

/**
 * For reviewing the three donor states without real donors: `?donorState=off|few|ready` on the page of a development server.
 * Returns null in production, so it can never change what a host sees there.
 */
export function previewDonorProgress(
  search: string
): ShareDonorProgress | null {
  if (process.env.NODE_ENV === 'production') return null;
  switch (new URLSearchParams(search).get('donorState')) {
    case 'off':
      return { status: 'off', count: 0, total: 4 };
    case 'few':
      return { status: 'few', count: 1, total: 1 };
    case 'ready':
      return { status: 'ready', count: 3, total: 3 };
    default:
      return null;
  }
}

const PREVIEW_DONORS = [
  'Anna Weber',
  'Ben Ohm',
  'Chloé Martin',
  'David Rao',
  'Emma Lind',
  'Finn Holt',
];

/**
 * For seeing a story with donors before anyone has given: `?donors=4` on the page of a development server stands in made-up donors for the real list. `donors` may be 0 to 60; the first six are named.
 * Returns null in production, so it can never change what a host or a visitor sees there.
 */
export function previewLeaderboard(search: string): ShareLeaderboard | null {
  if (process.env.NODE_ENV === 'production') return null;
  const asked = new URLSearchParams(search).get('donors');
  if (asked === null || !/^\d{1,2}$/.test(asked)) return null;
  const count = Number(asked);
  if (count > 60) return null;
  return {
    top: [],
    recent: PREVIEW_DONORS.slice(0, count).map((donorName, i) => ({
      id: `preview-${i}`,
      amount: 25,
      currency: 'EUR',
      donorName,
      created: '2026-10-01T10:00:00',
      isAnonymous: false,
      avatarUrl: null,
    })),
    donorCount: count,
  };
}

/** The early stage in which a host is reminded to refresh their story: it counts up to this many donors in all. Past it the fundraiser has momentum and the reminder goes by itself, so nothing needs to be stored. */
export const DONOR_REFRESH_MAX = 9;

/** True when donors can be named and the fundraiser is still early: time to refresh the story and share it again. */
export function isDonorRefreshMoment(
  progress: ShareDonorProgress | null | undefined
): boolean {
  return progress?.status === 'ready' && progress.total <= DONOR_REFRESH_MAX;
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
  /** "Supporting 5 projects", the Impact card's heading. */
  supporting?: (count: number) => string;
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

/** Whether the fundraiser shows its goal: the same settings the public page reads, the goal section and its "Show goal" line. */
export function showsGoal(fundraiser: Fundraiser): boolean {
  return (
    isGoalSectionShown(fundraiser) &&
    fundraiser.goalAmount > 0 &&
    (fundraiser.settings?.modules?.donor_score?.show_goal ?? true)
  );
}

export interface ShareProject {
  id: string;
  name: string;
  /** The project has a picture of its own. */
  hasImage: boolean;
}

/** The projects the fundraiser supports, the biggest share first. The shares themselves are not used on an image. */
export function getShareProjectList(fundraiser: Fundraiser): ShareProject[] {
  return [...(fundraiser.projectAllocations ?? [])]
    .sort((a, b) => b.percentage - a.percentage)
    .flatMap(allocation => {
      const name = allocation.project.name?.trim();
      return name
        ? [
            {
              id: allocation.project.id,
              name,
              hasImage: Boolean(allocation.project.image),
            },
          ]
        : [];
    });
}

/** Just the names, in the same order, for the caption and the Impact card. */
export function getShareProjectNames(fundraiser: Fundraiser): string[] {
  return getShareProjectList(fundraiser).map(project => project.name);
}

/** The Impact card names at most this many projects; a bouquet can hold more. */
export const IMPACT_NAMES = 5;

/** The Story card's text when the host wrote no line: the start of the description, unless it only repeats the title. */
export function getShareStoryText(fundraiser: Fundraiser): string | null {
  const excerpt = shareStoryExcerpt(fundraiser.description);
  return excerpt && !repeatsTitle(excerpt, fundraiser.title) ? excerpt : null;
}

/** Whether the story only repeats the title, as it does on a fundraiser whose description is a draft. Then the card has no story to tell. */
function repeatsTitle(story: string, title: string): boolean {
  const plain = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  const a = plain(story);
  const b = plain(title);
  return a === b || (a.startsWith(b) && a.length - b.length < 12);
}

const STORY_EXCERPT_LENGTH = 110;

/**
 * The start of the fundraiser's story as plain text for the Story card: tags and entities removed, cut at a word and ended with an ellipsis.
 * The description is rich text, so a paragraph break becomes a space.
 */
export function shareStoryExcerpt(
  html: string | null | undefined,
  max = STORY_EXCERPT_LENGTH
): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  // A whole first sentence reads better than a cut one.
  const sentence = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('? ')
  );
  if (sentence > max * 0.3) return cut.slice(0, sentence + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
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
  note = null,
  showAmounts = true,
  showHost = true,
  card = 'progress',
  showProjects = false,
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
  /** The host's own line for the image. */
  note?: string | null;
  /** Off leaves out the raised amount, the goal and the ring, as if the host had hidden the goal section. */
  showAmounts?: boolean;
  /** Off leaves out the host's name. */
  showHost?: boolean;
  /** The Story card falls back to the start of the fundraiser's story when the host wrote no line of their own. */
  card?: ShareCardId;
  /** Puts the supported projects on the image, for the Impact card. Off by default, so the link preview stays as it was. */
  showProjects?: boolean;
}): ShareRenderData {
  const host = getShareHostName(fundraiser);
  const projectNames = getShareProjectNames(fundraiser);
  const storyText = getShareStoryText(fundraiser);
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
  // Share images are public, so they show no money when the host hid the goal section, even in the studio where the host sees every figure.
  const showsMoney = isGoalSectionShown(fundraiser) && showAmounts;
  // Nothing raised yet: lead with the goal and invite the first gift, rather than show zeros.
  // A gift in a currency with no rate adds nothing to `raised`, but must still never sit next to the first-gift invite.
  // With the money hidden the public total arrives empty, which says nothing about whether anyone gave.
  const fresh =
    showsMoney && raised <= 0 && !gift && !hasFundraiserConcluded(fundraiser);
  return {
    name: fundraiser.title,
    byLine: host && showHost ? labels.byLine(host) : '',
    impact:
      showProjects && labels.supporting && projectNames.length > 0
        ? {
            label: labels.supporting(projectNames.length),
            names: projectNames.slice(0, IMPACT_NAMES),
            more: Math.max(0, projectNames.length - IMPACT_NAMES),
          }
        : null,
    note: note?.trim() || (card === 'story' ? storyText : null),
    raised,
    goal: showsGoal(fundraiser) && showAmounts ? fundraiser.goalAmount : null,
    formatMoney: amount =>
      formatCurrencyFromDecimal(
        Math.round(amount),
        fundraiser.currency,
        locale
      ),
    raisedLine: showsMoney
      ? (raisedText, goal) =>
          fresh
            ? goal
              ? labels.goal(goal)
              : labels.started()
            : goal
              ? labels.raisedOf(raisedText, goal)
              : labels.raised(raisedText)
      : null,
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
