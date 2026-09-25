'use client';

import {
  ShareLinksCard,
  useFundraiserDetail,
} from '@/components/dashboard/fundraiser-detail';
import { ShareStudio } from '@/components/share/share-studio';

export default function FundraiserSharePage() {
  const fundraiser = useFundraiserDetail();
  return (
    <div className='space-y-6'>
      <ShareStudio fundraiser={fundraiser} variant='host' />
      <ShareLinksCard slug={fundraiser.slug} />
    </div>
  );
}
