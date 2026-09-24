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
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
  onFundraiserRemoved: (id: string) => void;
  skeletonRows?: number;
}

export function FundraiserList({
  fundraisers,
  isLoading,
  isFiltered,
  onClearFilters,
  onFundraiserUpdated,
  onFundraiserRemoved,
  skeletonRows = 4,
}: FundraiserListProps) {
  if (isLoading) {
    return (
      <ul className='fundraiser-list grid grid-cols-1 gap-x-8 md:grid-cols-2'>
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <FundraiserListItemSkeleton key={index} />
        ))}
      </ul>
    );
  }

  if (fundraisers.length === 0) {
    if (isFiltered) {
      return <FundraiserListNoResults onClearFilters={onClearFilters} />;
    }
    return <FundraiserListEmpty />;
  }

  return (
    <ul className='fundraiser-list grid grid-cols-1 gap-x-8 md:grid-cols-2'>
      {fundraisers.map(fundraiser => (
        <FundraiserListItem
          key={fundraiser.id}
          fundraiser={fundraiser}
          onFundraiserUpdated={onFundraiserUpdated}
          onFundraiserRemoved={onFundraiserRemoved}
        />
      ))}
    </ul>
  );
}
