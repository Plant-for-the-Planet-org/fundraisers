import type { Metadata } from 'next';

import { notFound } from 'next/navigation';
import { SentryTestClient } from './sentry-test-client';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function SentryTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <SentryTestClient />;
}
