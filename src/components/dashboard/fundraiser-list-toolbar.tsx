'use client';

import type {
  FundraiserListFilters,
  FundraiserListSort,
  FundraiserListStatusFilter,
  FundraiserStatusCounts,
} from '@/lib/utils/fundraiser-list';

import { FundraiserSearchInput } from './fundraiser-search-input';
import { FundraiserSortMenu } from './fundraiser-sort-menu';
import { FundraiserStatusFilter } from './fundraiser-status-filter';

interface FundraiserListToolbarProps {
  filters: FundraiserListFilters;
  counts: FundraiserStatusCounts;
  onChange: (next: Partial<FundraiserListFilters>) => void;
}

export function FundraiserListToolbar({
  filters,
  counts,
  onChange,
}: FundraiserListToolbarProps) {
  const handleSearch = (search: string) => onChange({ search });
  const handleStatus = (status: FundraiserListStatusFilter) =>
    onChange({ status });
  const handleSort = (sort: FundraiserListSort) => onChange({ sort });

  return (
    <div className='fundraiser-list-toolbar flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center'>
      <FundraiserSearchInput
        value={filters.search}
        onChange={handleSearch}
        className='w-full md:min-w-[16rem] md:flex-1'
      />
      <FundraiserStatusFilter
        value={filters.status}
        counts={counts}
        onChange={handleStatus}
        className='w-full md:w-auto'
      />
      <FundraiserSortMenu
        value={filters.sort}
        onChange={handleSort}
        className='w-full md:w-52'
      />
    </div>
  );
}
