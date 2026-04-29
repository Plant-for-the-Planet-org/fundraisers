import type { Fundraiser } from '@/lib/types/fundraiser';

import { getDaysLeft } from './fundraiser';

export type DisplayStatus = 'active' | 'paused' | 'ended' | 'ending-soon';

export type FundraiserListSort =
  | 'newest'
  | 'oldest'
  | 'most-raised'
  | 'ending-soonest'
  | 'name-asc';

export type FundraiserListStatusFilter = 'all' | 'active' | 'paused' | 'ended';

export interface FundraiserListFilters {
  search: string;
  status: FundraiserListStatusFilter;
  sort: FundraiserListSort;
}

export interface FundraiserStatusCounts {
  all: number;
  active: number;
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
    case 'draft':
      return 'paused';
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

function getHostNames(fundraiser: Fundraiser): string[] {
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
    case 'paused':
      return fundraiser.status === 'paused' || fundraiser.status === 'draft';
    case 'ended':
      return (
        fundraiser.status === 'completed' || fundraiser.status === 'cancelled'
      );
    default:
      return true;
  }
}

export function filterFundraisers(
  list: Fundraiser[],
  filters: Pick<FundraiserListFilters, 'search' | 'status'>
): Fundraiser[] {
  const query = filters.search.trim().toLowerCase();
  return list.filter(
    f => matchesStatus(f, filters.status) && matchesSearch(f, query)
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
  list: Fundraiser[],
  sort: FundraiserListSort,
  locale?: string
): Fundraiser[] {
  const copy = [...list];

  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => compareDatesDesc(a.startDate, b.startDate));
    case 'oldest':
      return copy.sort((a, b) => compareDatesAsc(a.startDate, b.startDate));
    case 'most-raised':
      return copy.sort((a, b) => {
        const diff = compareNumbersDesc(a.totalRaised, b.totalRaised);
        if (diff !== 0) return diff;
        return a.currency.localeCompare(b.currency);
      });
    case 'ending-soonest':
      // Active rows first, then non-active by endDate. Within active, rows
      // with positive daysLeft sort ahead; an active fundraiser past its
      // endDate (daysLeft === 0) is treated as non-positive and pushed
      // below still-running ones — the backend is expected to transition
      // it to `completed`, so this is a transient state.
      return copy.sort((a, b) => {
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
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, locale, { sensitivity: 'base' })
      );
    default:
      return copy;
  }
}

export function getStatusCounts(list: Fundraiser[]): FundraiserStatusCounts {
  const counts: FundraiserStatusCounts = {
    all: list.length,
    active: 0,
    paused: 0,
    ended: 0,
  };

  for (const fundraiser of list) {
    switch (fundraiser.status) {
      case 'active':
        counts.active += 1;
        break;
      case 'paused':
      case 'draft':
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
