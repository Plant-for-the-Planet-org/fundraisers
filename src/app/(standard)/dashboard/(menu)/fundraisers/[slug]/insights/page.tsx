import { notFound } from 'next/navigation';
import { isUmamiStatsConfigured } from '@/lib/analytics/umami-stats';
import { FundraiserInsightsView } from '@/components/dashboard/fundraiser-detail';

// Without an Umami key there is nothing to show, so the page does not exist and its tab is hidden.
export default function FundraiserInsightsPage() {
  if (!isUmamiStatsConfigured()) notFound();
  return <FundraiserInsightsView />;
}
