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
      <FundraiserSearchInput
        value={filters.search}
        onChange={handleSearchChange}
        className='min-w-0 flex-1'
      />
      <div className='flex items-center gap-3'>
        <FundraiserStatusFilter
          value={filters.status}
          statusCounts={statusCounts}
          onChange={handleStatusChange}
          tabsClassName='hidden lg:inline-flex'
          dropdownClassName='lg:hidden grow shrink basis-0 md:basis-auto md:w-40 md:grow-0'
        />
        <FundraiserSortMenu
          value={filters.sort}
          onChange={handleSortChange}
          className='grow shrink basis-0 md:basis-auto md:w-50 md:grow-0'
        />
      </div>
    </div>
  );
}
