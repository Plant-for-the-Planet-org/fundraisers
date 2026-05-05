'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  filterFundraisers,
  getStatusCounts,
  sortFundraisers,
} from '@/lib/utils/fundraiser-list';
import { FundraiserList } from './fundraiser-list';
import { FundraiserListToolbar } from './fundraiser-list-toolbar';
import { useFundraiserListFilters } from './use-fundraiser-list-filters';

interface FundraiserListSectionProps {
  fundraisers: Fundraiser[];
  isLoading: boolean;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
}

export function FundraiserListSection({
  fundraisers,
  isLoading,
  onFundraiserUpdated,
}: FundraiserListSectionProps) {
  const t = useTranslations('Dashboard.toolbar');
  const locale = useLocale();
  const { filters, updateFilters, resetFilters } = useFundraiserListFilters();

  // Apply search first so the status-pill counts reflect the active query.
  // Status is intentionally excluded so toggling between pills doesn't
  // change the counts — only typing in search does.
  const searchedFundraisers = useMemo(
    () =>
      filterFundraisers(fundraisers, {
        search: filters.search,
        status: 'all',
      }),
    [fundraisers, filters.search]
  );

  const counts = useMemo(
    () => getStatusCounts(searchedFundraisers),
    [searchedFundraisers]
  );

  const visibleFundraisers = useMemo(
    () =>
      sortFundraisers(
        filterFundraisers(searchedFundraisers, {
          search: '',
          status: filters.status,
        }),
        filters.sort,
        locale
      ),
    [searchedFundraisers, filters.status, filters.sort, locale]
  );

  const isFiltered = filters.search.trim() !== '' || filters.status !== 'all';

  const showToolbar = isLoading || fundraisers.length > 0;
  const showCount = !isLoading && fundraisers.length > 0;

  return (
    <div className='space-y-3'>
      {showToolbar && (
        <FundraiserListToolbar
          filters={filters}
          counts={counts}
          onFiltersChange={updateFilters}
        />
      )}

      {showCount && (
        <p className='text-sm text-muted-foreground'>
          {t.rich('resultCount', {
            visible: visibleFundraisers.length.toLocaleString(locale),
            total: fundraisers.length.toLocaleString(locale),
            bold: chunks => (
              <strong className='font-semibold text-foreground'>
                {chunks}
              </strong>
            ),
          })}
        </p>
      )}

      <FundraiserList
        fundraisers={visibleFundraisers}
        isLoading={isLoading}
        isFiltered={isFiltered}
        onClearFilters={resetFilters}
        onFundraiserUpdated={onFundraiserUpdated}
      />
    </div>
  );
}
