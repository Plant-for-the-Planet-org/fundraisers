'use client';

import {
  ShareLinksCard,
  useFundraiserDetail,
} from '@/components/dashboard/fundraiser-detail';

// Story images and post templates to download will sit here as more cards.
export default function FundraiserSharePage() {
  const fundraiser = useFundraiserDetail();
  return (
    <div className='space-y-6'>
      <ShareLinksCard slug={fundraiser.slug} />
    </div>
  );
}
