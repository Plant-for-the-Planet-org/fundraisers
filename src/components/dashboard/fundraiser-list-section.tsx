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
}

export function FundraiserListSection({
  fundraisers,
  isLoading,
}: FundraiserListSectionProps) {
  const t = useTranslations('Dashboard.toolbar');
  const locale = useLocale();
  const { filters, updateFilters, resetFilters } = useFundraiserListFilters();

  const counts = useMemo(() => getStatusCounts(fundraisers), [fundraisers]);

  const visibleFundraisers = useMemo(
    () =>
      sortFundraisers(
        filterFundraisers(fundraisers, {
          search: filters.search,
          status: filters.status,
        }),
        filters.sort,
        locale
      ),
    [fundraisers, filters.search, filters.status, filters.sort, locale]
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
      />
    </div>
  );
}
