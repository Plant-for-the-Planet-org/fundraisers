import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { isUmamiStatsConfigured } from '@/lib/analytics/umami-stats';
import { AccountInsightsView } from '@/components/dashboard';

// Without an Umami key there is nothing to show, so the page does not exist and its menu item is hidden.
export default function DashboardInsightsPage() {
  if (!isUmamiStatsConfigured()) notFound();
  return (
    // The view reads the selected fundraiser from the URL.
    <Suspense>
      <AccountInsightsView />
    </Suspense>
  );
}
