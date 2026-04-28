'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useMemo } from 'react';
import { FundraiserListEmpty } from './fundraiser-list-empty';
import { FundraiserListItem } from './fundraiser-list-item';
import { FundraiserListItemSkeleton } from './fundraiser-list-item-skeleton';

interface FundraiserListProps {
  fundraisers: Fundraiser[];
  isLoading: boolean;
}

const SKELETON_ROWS = 4;

export function FundraiserList({
  fundraisers,
  isLoading,
}: FundraiserListProps) {
  const sorted = useMemo(
    () =>
      [...fundraisers].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [fundraisers]
  );

  if (isLoading) {
    return (
      <ul className='fundraiser-list divide-y divide-border/60'>
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <FundraiserListItemSkeleton key={index} />
        ))}
      </ul>
    );
  }

  if (sorted.length === 0) {
    return <FundraiserListEmpty />;
  }

  return (
    <ul className='fundraiser-list divide-y divide-border/60'>
      {sorted.map(fundraiser => (
        <FundraiserListItem key={fundraiser.id} fundraiser={fundraiser} />
      ))}
    </ul>
  );
}
