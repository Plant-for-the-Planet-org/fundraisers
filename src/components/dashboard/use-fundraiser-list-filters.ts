'use client';

import type { FundraiserListFilters } from '@/lib/utils/fundraiser-list';

import { useCallback, useState } from 'react';
import { DEFAULT_FUNDRAISER_LIST_FILTERS } from '@/lib/utils/fundraiser-list';

interface UseFundraiserListFiltersResult {
  filters: FundraiserListFilters;
  updateFilters: (next: Partial<FundraiserListFilters>) => void;
  resetFilters: () => void;
}

export function useFundraiserListFilters(): UseFundraiserListFiltersResult {
  const [filters, setFilters] = useState<FundraiserListFilters>(
    DEFAULT_FUNDRAISER_LIST_FILTERS
  );

  const updateFilters = useCallback((next: Partial<FundraiserListFilters>) => {
    setFilters(prev => ({ ...prev, ...next }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FUNDRAISER_LIST_FILTERS);
  }, []);

  return { filters, updateFilters, resetFilters };
}
