'use client';

import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  DashboardHeader,
  DashboardSummary,
  LatestFundraisers,
  PendingInvitations,
  useDashboardFundraisers,
  useInsightsEnabled,
  useWeeklyViews,
} from '@/components/dashboard';

export default function DashboardOverviewPage() {
  const t = useTranslations('Dashboard.overview');
  const {
    fundraisers,
    summary,
    isLoading,
    hasError,
    refetch,
    onFundraiserUpdated,
    onFundraiserRemoved,
  } = useDashboardFundraisers();
  const insightsEnabled = useInsightsEnabled();
  // Only ask once the list has loaded and has something with a public page. With nothing to count the answer is simply 0, without a request.
  const hasPublicFundraiser = fundraisers.some(
    fundraiser => fundraiser.status !== 'draft'
  );
  const fetchedViews = useWeeklyViews(
    insightsEnabled && !isLoading && hasPublicFundraiser
  );
  const weeklyViews =
    !isLoading && !hasPublicFundraiser
      ? { views: 0, previousViews: 0 }
      : fetchedViews;

  return (
    <AuthGuard>
      <section className='space-y-6'>
        <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

        <DashboardSummary
          summary={summary}
          isLoading={isLoading}
          hasError={hasError}
          onRetry={refetch}
          showViews={insightsEnabled}
          weeklyViews={weeklyViews}
        />

        {/* Accepting adds a fundraiser to the list and changes the summary tiles, so this refetches rather than patching local state: the platform only lists fundraisers where you are already an active host. */}
        <PendingInvitations onAccepted={refetch} />

        {!hasError && (
          <LatestFundraisers
            fundraisers={fundraisers}
            isLoading={isLoading}
            onFundraiserUpdated={onFundraiserUpdated}
            onFundraiserRemoved={onFundraiserRemoved}
          />
        )}
      </section>
    </AuthGuard>
  );
}
