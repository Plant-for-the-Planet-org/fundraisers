'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { FundraiserListEmpty } from './fundraiser-list-empty';
import { FundraiserListItem } from './fundraiser-list-item';
import { FundraiserListItemSkeleton } from './fundraiser-list-item-skeleton';
import { FundraiserListNoResults } from './fundraiser-list-no-results';

interface FundraiserListProps {
  fundraisers: Fundraiser[];
  isLoading: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}

const SKELETON_ROWS = 4;

export function FundraiserList({
  fundraisers,
  isLoading,
  isFiltered,
  onClearFilters,
}: FundraiserListProps) {
  if (isLoading) {
    return (
      <ul className='fundraiser-list divide-y divide-border/60'>
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <FundraiserListItemSkeleton key={index} />
        ))}
      </ul>
    );
  }

  if (fundraisers.length === 0) {
    if (isFiltered) {
      return <FundraiserListNoResults onClear={onClearFilters} />;
    }
    return <FundraiserListEmpty />;
  }

  return (
    <ul className='fundraiser-list divide-y divide-border/60'>
      {fundraisers.map(fundraiser => (
        <FundraiserListItem key={fundraiser.id} fundraiser={fundraiser} />
      ))}
    </ul>
  );
}
