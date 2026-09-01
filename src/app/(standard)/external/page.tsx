import type { Metadata } from 'next';

import { Suspense } from 'react';
import { ExternalLinkWarning } from './external-link-warning';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function ExternalPage() {
  return (
    <Suspense>
      <ExternalLinkWarning />
    </Suspense>
  );
}
