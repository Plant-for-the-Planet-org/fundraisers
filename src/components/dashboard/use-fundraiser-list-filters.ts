'use client';

import type { FundraiserListFilters } from '@/lib/utils/fundraiser-list';

import { useCallback, useState } from 'react';
import { DEFAULT_FUNDRAISER_LIST_FILTERS } from '@/lib/utils/fundraiser-list';

interface UseFundraiserListFiltersResult {
  filters: FundraiserListFilters;
  setFilters: (next: Partial<FundraiserListFilters>) => void;
  reset: () => void;
}

export function useFundraiserListFilters(): UseFundraiserListFiltersResult {
  const [filters, setFiltersState] = useState<FundraiserListFilters>(
    DEFAULT_FUNDRAISER_LIST_FILTERS
  );

  const setFilters = useCallback((next: Partial<FundraiserListFilters>) => {
    setFiltersState(prev => ({ ...prev, ...next }));
  }, []);

  const reset = useCallback(() => {
    setFiltersState(DEFAULT_FUNDRAISER_LIST_FILTERS);
  }, []);

  return { filters, setFilters, reset };
}
