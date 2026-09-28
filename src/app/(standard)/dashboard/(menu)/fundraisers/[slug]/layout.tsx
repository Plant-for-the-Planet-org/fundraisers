import { isUmamiStatsConfigured } from '@/lib/analytics/umami-stats';
import { FundraiserDetailShell } from '@/components/dashboard/fundraiser-detail';

export default async function FundraiserDetailLayout({
  children,
  params,
}: LayoutProps<'/dashboard/fundraisers/[slug]'>) {
  const { slug } = await params;
  return (
    <FundraiserDetailShell
      slug={slug}
      // The Umami key is server-only, so whether Insights exists is decided here.
      insightsEnabled={isUmamiStatsConfigured()}
    >
      {children}
    </FundraiserDetailShell>
  );
}
