'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { formatCompactNumber } from '@/lib/utils';
import { DonorsStripSkeleton } from './donors-strip';
import { donorsSummaryPanelProps } from './donors-summary';
import { DonorsSummaryPanel } from './donors-summary-panel';
import { SectionHeader } from './typography';

interface DonorsSummaryClientLoaderProps {
  fundraiser: Fundraiser;
}

/**
 * Client-side counterpart to DonorsSummary, used on the FundraiserAuthRetry
 * (draft/private) path. DonorsSummary is an async server component, and
 * React can't run async components in a client tree without re-invoking
 * them on every render, causing an infinite refetch loop. This fetches
 * once via a ref guard instead, mirroring LeaderboardClientLoader.
 */
export function DonorsSummaryClientLoader({
  fundraiser,
}: DonorsSummaryClientLoaderProps) {
  const t = useTranslations('Fundraisers');
  const locale = useLocale();
  const [data, setData] = useState<LeaderboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    getLeaderboard(fundraiser.slug)
      .then(setData)
      .catch(() => {
        // Swallow error - falls back to count-only header below.
      })
      .finally(() => setIsLoading(false));
  }, [fundraiser.slug]);

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3'>
        <SectionHeader>
          {t('donationCount', {
            count: fundraiser.donationCount,
            formattedCount: formatCompactNumber(
              fundraiser.donationCount,
              locale
            ),
          })}
        </SectionHeader>
        <DonorsStripSkeleton />
      </div>
    );
  }

  const props = donorsSummaryPanelProps(fundraiser, data);
  if (!props) return null;

  return <DonorsSummaryPanel {...props} />;
}
