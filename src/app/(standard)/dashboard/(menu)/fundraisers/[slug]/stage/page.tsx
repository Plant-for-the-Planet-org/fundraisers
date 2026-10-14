'use client';

import {
  StageEditor,
  StageLinkCard,
  useCanEditFundraiser,
  useFundraiserDetail,
  useRefreshFundraiser,
} from '@/components/dashboard/fundraiser-detail';

export default function FundraiserStagePage() {
  const fundraiser = useFundraiserDetail();
  const canEdit = useCanEditFundraiser();
  const refresh = useRefreshFundraiser();

  return (
    <div className='space-y-6'>
      <StageLinkCard fundraiser={fundraiser} />
      {canEdit && (
        <StageEditor
          key={fundraiser.id}
          fundraiser={fundraiser}
          onSaved={() => void refresh()}
        />
      )}
    </div>
  );
}
