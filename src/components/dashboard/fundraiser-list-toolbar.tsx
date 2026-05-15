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
  statusCounts: FundraiserStatusCounts;
  onFiltersChange: (next: Partial<FundraiserListFilters>) => void;
}

export function FundraiserListToolbar({
  filters,
  statusCounts,
  onFiltersChange,
}: FundraiserListToolbarProps) {
  const handleSearchChange = (search: string) => onFiltersChange({ search });
  const handleStatusChange = (status: FundraiserListStatusFilter) =>
    onFiltersChange({ status });
  const handleSortChange = (sort: FundraiserListSort) =>
    onFiltersChange({ sort });

  return (
    <div className='fundraiser-list-toolbar flex flex-col items-stretch gap-3 md:flex-row md:items-center'>
      <div className='flex items-center gap-3 md:contents'>
        <FundraiserSearchInput
          value={filters.search}
          onChange={handleSearchChange}
          className='min-w-0 flex-1'
        />
        <FundraiserStatusFilter
          value={filters.status}
          statusCounts={statusCounts}
          onChange={handleStatusChange}
          className='w-40 shrink-0 md:w-auto'
        />
      </div>
      <FundraiserSortMenu
        value={filters.sort}
        onChange={handleSortChange}
        className='w-full md:w-52 md:shrink-0'
      />
    </div>
  );
}
