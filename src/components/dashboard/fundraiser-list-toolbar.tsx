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

  // Container queries rather than screen breakpoints, because the dashboard menu takes part of the width.
  return (
    <div className='@container'>
      <div className='fundraiser-list-toolbar flex flex-col items-stretch gap-3 @4xl:flex-row @4xl:items-center'>
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
            inlineFilterClassName='hidden @2xl:inline-flex'
            dropdownFilterClassName='@2xl:hidden grow shrink basis-0 @xl:basis-auto @xl:w-40 @xl:grow-0'
          />
          <FundraiserSortMenu
            value={filters.sort}
            onChange={handleSortChange}
            className='grow shrink basis-0 @xl:basis-auto @xl:w-50 @xl:grow-0 @2xl:ml-auto'
          />
        </div>
      </div>
    </div>
  );
}
