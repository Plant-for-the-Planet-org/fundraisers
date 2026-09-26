'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { isFundraiserLive, sortFundraisers } from '@/lib/utils/fundraiser-list';
import { FundraiserList } from './fundraiser-list';

const LATEST_COUNT = 2;

interface LatestFundraisersProps {
  fundraisers: Fundraiser[];
  isLoading: boolean;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
  onFundraiserRemoved: (id: string) => void;
}

export function LatestFundraisers({
  fundraisers,
  isLoading,
  onFundraiserUpdated,
  onFundraiserRemoved,
}: LatestFundraisersProps) {
  const t = useTranslations('Dashboard.overview.latest');
  const locale = useLocale();

  // Live fundraisers first: the Overview is about what is happening now, next to the "Active fundraisers" count. When nothing is live, fall back to the newest ones so the section is never empty.
  const { shown, showingLive } = useMemo(() => {
    const newest = sortFundraisers(fundraisers, 'newest', locale);
    const live = newest.filter(isFundraiserLive);
    return {
      shown: (live.length > 0 ? live : newest).slice(0, LATEST_COUNT),
      showingLive: live.length > 0,
    };
  }, [fundraisers, locale]);

  // With no fundraisers at all, a "Latest fundraisers" heading over the empty state would read oddly, so it is left out.
  const hasAny = isLoading || fundraisers.length > 0;

  return (
    <section className='space-y-3'>
      {hasAny && (
        <div className='flex items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-foreground'>
            {showingLive ? t('activeTitle') : t('title')}
          </h2>
          {!isLoading && fundraisers.length > shown.length && (
            <Link
              href='/dashboard/fundraisers'
              className='text-sm font-medium text-accent-color hover:underline'
            >
              {t('viewAll', { count: fundraisers.length })}
            </Link>
          )}
        </div>
      )}

      <FundraiserList
        fundraisers={shown}
        isLoading={isLoading}
        isFiltered={false}
        onClearFilters={() => {}}
        onFundraiserUpdated={onFundraiserUpdated}
        onFundraiserRemoved={onFundraiserRemoved}
        skeletonRows={LATEST_COUNT}
      />
    </section>
  );
}
