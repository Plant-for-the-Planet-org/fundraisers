'use client';

import { useState } from 'react';
import {
  FundraiserChecklistCard,
  FundraiserHostsCard,
  FundraiserModulesCard,
  FundraiserPerformance,
  ReshareMomentCard,
  useCanEditFundraiser,
  useFundraiserDetail,
  useLeaderboardSummary,
} from '@/components/dashboard/fundraiser-detail';

export default function FundraiserDetailOverviewPage() {
  const fundraiser = useFundraiserDetail();
  const canEdit = useCanEditFundraiser();
  // Only the donor count is needed from the leaderboard summary.
  const { data } = useLeaderboardSummary(fundraiser.id, 1);
  const [hostsDialogOpen, setHostsDialogOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <ReshareMomentCard fundraiser={fundraiser} />
      <FundraiserPerformance
        fundraiser={fundraiser}
        donorCount={data?.donorCount ?? null}
      />
      <FundraiserChecklistCard
        fundraiser={fundraiser}
        canEdit={canEdit}
        onInviteCoHost={() => setHostsDialogOpen(true)}
        donorCount={data?.donorCount ?? null}
      />
      <FundraiserHostsCard
        fundraiser={fundraiser}
        canEdit={canEdit}
        dialogOpen={hostsDialogOpen}
        onDialogOpenChange={setHostsDialogOpen}
      />
      <FundraiserModulesCard fundraiser={fundraiser} canEdit={canEdit} />
    </div>
  );
}
