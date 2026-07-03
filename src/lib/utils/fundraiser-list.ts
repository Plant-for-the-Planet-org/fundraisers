import type { Fundraiser } from '@/lib/types/fundraiser';

import { getDaysLeft } from './fundraiser';

export type DisplayStatus =
  | 'active'
  | 'draft'
  | 'paused'
  | 'ended'
  | 'ending-soon';

export type FundraiserListSort =
  | 'newest'
  | 'oldest'
  | 'most-raised'
  | 'ending-soonest'
  | 'name-asc';

export type FundraiserListStatusFilter =
  | 'all'
  | 'active'
  | 'draft'
  | 'paused'
  | 'ended';

export interface FundraiserListFilters {
  search: string;
  status: FundraiserListStatusFilter;
  sort: FundraiserListSort;
}

export interface FundraiserStatusCounts {
  all: number;
  active: number;
  draft: number;
  paused: number;
  ended: number;
}

export const ENDING_SOON_THRESHOLD_DAYS = 7;

export const DEFAULT_FUNDRAISER_LIST_FILTERS: FundraiserListFilters = {
  search: '',
  status: 'all',
  sort: 'newest',
};

// Used by `FundraiserStatusBadge` (added in PR 3) to pick the badge variant.
export function deriveDisplayStatus(fundraiser: Fundraiser): DisplayStatus {
  switch (fundraiser.status) {
    case 'completed':
    case 'cancelled':
      return 'ended';
    case 'paused':
      return 'paused';
    case 'draft':
      return 'draft';
    case 'active': {
      const daysLeft = getDaysLeft(fundraiser.endDate);
      if (daysLeft > 0 && daysLeft <= ENDING_SOON_THRESHOLD_DAYS) {
        return 'ending-soon';
      }
      return 'active';
    }
    default:
      return 'active';
  }
}

export function getHostNames(fundraiser: Fundraiser): string[] {
  return fundraiser.hosts
    .map(host => host.displayName ?? host.user?.name)
    .filter((name): name is string => Boolean(name));
}

function matchesSearch(fundraiser: Fundraiser, query: string): boolean {
  if (!query) return true;
  const haystack = [fundraiser.title, ...getHostNames(fundraiser)]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function matchesStatus(
  fundraiser: Fundraiser,
  filter: FundraiserListStatusFilter
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'active':
      return fundraiser.status === 'active';
    case 'draft':
      return fundraiser.status === 'draft';
    case 'paused':
      return fundraiser.status === 'paused';
    case 'ended':
      return (
        fundraiser.status === 'completed' || fundraiser.status === 'cancelled'
      );
    default: {
      filter satisfies never;
      return true;
    }
  }
}

export function filterFundraisers(
  fundraisers: Fundraiser[],
  filters: Pick<FundraiserListFilters, 'search' | 'status'>
): Fundraiser[] {
  const query = filters.search.trim().toLowerCase();
  return fundraisers.filter(
    f => matchesStatus(f, filters.status) && matchesSearch(f, query)
  );
}

// Sums all currency amounts as a best-effort sort key for multi-currency fundraisers.
function sumTotalRaised(totalRaised: Record<string, number>): number {
  return Object.values(totalRaised).reduce(
    (sum, amountForSingleCurrency) =>
      sum +
      (Number.isFinite(amountForSingleCurrency) ? amountForSingleCurrency : 0),
    0
  );
}

function compareNumbersDesc(a: number, b: number): number {
  return b - a;
}

function compareDatesDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

function compareDatesAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

export function sortFundraisers(
  fundraisers: Fundraiser[],
  sort: FundraiserListSort,
  locale?: string
): Fundraiser[] {
  const sorted = [...fundraisers];

  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => compareDatesDesc(a.startDate, b.startDate));
    case 'oldest':
      return sorted.sort((a, b) => compareDatesAsc(a.startDate, b.startDate));
    case 'most-raised':
      return sorted.sort((a, b) => {
        const diff = compareNumbersDesc(
          sumTotalRaised(a.totalRaised),
          sumTotalRaised(b.totalRaised)
        );
        if (diff !== 0) return diff;
        return a.currency.localeCompare(b.currency);
      });
    case 'ending-soonest':
      // Active rows first, then non-active by endDate. Within active, rows
      // with positive daysLeft sort ahead; an active fundraiser past its
      // endDate (daysLeft === 0) is treated as non-positive and pushed
      // below still-running ones — the backend is expected to transition
      // it to `completed`, so this is a transient state.
      return sorted.sort((a, b) => {
        const aActive = a.status === 'active';
        const bActive = b.status === 'active';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        if (!aActive && !bActive) {
          return compareDatesAsc(a.endDate, b.endDate);
        }
        const aDaysLeft = getDaysLeft(a.endDate);
        const bDaysLeft = getDaysLeft(b.endDate);
        const aPositive = aDaysLeft > 0;
        const bPositive = bDaysLeft > 0;
        if (aPositive && !bPositive) return -1;
        if (!aPositive && bPositive) return 1;
        return aDaysLeft - bDaysLeft;
      });
    case 'name-asc':
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, locale, { sensitivity: 'base' })
      );
    default:
      return sorted;
  }
}

export function getStatusCounts(
  fundraisers: Fundraiser[]
): FundraiserStatusCounts {
  const counts: FundraiserStatusCounts = {
    all: fundraisers.length,
    active: 0,
    draft: 0,
    paused: 0,
    ended: 0,
  };

  for (const fundraiser of fundraisers) {
    switch (fundraiser.status) {
      case 'active':
        counts.active += 1;
        break;
      case 'draft':
        counts.draft += 1;
        break;
      case 'paused':
        counts.paused += 1;
        break;
      case 'completed':
      case 'cancelled':
        counts.ended += 1;
        break;
    }
  }

  return counts;
}
