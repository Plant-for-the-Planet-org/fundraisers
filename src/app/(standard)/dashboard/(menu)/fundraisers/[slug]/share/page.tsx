'use client';

import {
  ShareLinksCard,
  StageLinkCard,
  useCanEditFundraiser,
  useFundraiserDetail,
} from '@/components/dashboard/fundraiser-detail';
import { ShareStudio } from '@/components/share/share-studio';

export default function FundraiserSharePage() {
  const fundraiser = useFundraiserDetail();
  const canEdit = useCanEditFundraiser();
  return (
    <div className='space-y-6'>
      <ShareStudio fundraiser={fundraiser} variant='host' />
      <StageLinkCard fundraiser={fundraiser} canEdit={canEdit} />
      <ShareLinksCard slug={fundraiser.slug} />
    </div>
  );
}
