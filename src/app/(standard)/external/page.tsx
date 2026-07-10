import type { Metadata } from 'next';

import { Suspense } from 'react';
import { ExternalPageClient } from './external-page-client';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function ExternalPage() {
  return (
    <Suspense>
      <ExternalPageClient />
    </Suspense>
  );
}
