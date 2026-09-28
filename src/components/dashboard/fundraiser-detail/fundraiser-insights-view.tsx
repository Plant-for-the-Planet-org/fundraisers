'use client';

import { useState } from 'react';
import { useFundraiserDetail } from './fundraiser-detail-context';
import {
  FundraiserInsightsCard,
  InsightsAccuracyNote,
} from './fundraiser-insights-card';

export function FundraiserInsightsView() {
  const fundraiser = useFundraiserDetail();
  // Read once on mount; a campaign starting while the page is open is not worth a re-render.
  const [now] = useState(() => Date.now());
  const campaignStarted =
    fundraiser.status !== 'draft' &&
    new Date(fundraiser.startDate).getTime() <= now;

  return (
    <div className='space-y-6'>
      <FundraiserInsightsCard
        slug={fundraiser.slug}
        campaignStarted={campaignStarted}
      />
      <InsightsAccuracyNote />
    </div>
  );
}
