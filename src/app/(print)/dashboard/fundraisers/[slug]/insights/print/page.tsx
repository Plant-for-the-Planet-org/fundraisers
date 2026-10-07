import { notFound } from 'next/navigation';
import { parseReportRange } from '@/lib/analytics/insights-report';
import { isUmamiStatsConfigured } from '@/lib/analytics/umami-stats';
import { FundraiserPrintShell } from '@/components/dashboard/fundraiser-detail';

// Without an Umami key there is nothing to show, so the page does not exist, like the Insights tab it prints.
export default async function FundraiserInsightsPrintPage({
  params,
  searchParams,
}: PageProps<'/dashboard/fundraisers/[slug]/insights/print'>) {
  if (!isUmamiStatsConfigured()) notFound();

  const { slug } = await params;
  const { range } = await searchParams;

  return (
    <FundraiserPrintShell
      slug={slug}
      range={parseReportRange(typeof range === 'string' ? range : null)}
    />
  );
}
