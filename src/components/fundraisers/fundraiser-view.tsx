import type { ReactNode } from 'react';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { getTaxDeductibilityInfo } from '@/lib/utils/country-currency';
import {
  convertTotalRaisedToSingleCurrency,
  getDaysLeft,
} from '@/lib/utils/fundraiser';
import { ClosedForContribution } from '@/components/fundraisers/closed-for-contribution';
import DescriptionDisplay from '@/components/fundraisers/description-display';
import { DonationSection } from '@/components/fundraisers/donation-section';
import { DonorsStripSkeleton } from '@/components/fundraisers/donors-strip';
import { DonorsSummary } from '@/components/fundraisers/donors-summary';
import { DonorsSummaryPanel } from '@/components/fundraisers/donors-summary-panel';
import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';
import { Hosts } from '@/components/fundraisers/hosts';
import ImageDisplay from '@/components/fundraisers/image-display';
import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import { SecurityNotice } from '@/components/fundraisers/security-notice';
import TitleDisplay from '@/components/fundraisers/title-display';
import { SectionHeader } from '@/components/fundraisers/typography';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { CopyLinkButton } from './copy-link-button';
import { LeaderboardClientLoader } from './leaderboard/leaderboard-client-loader';
import { LeaderboardServerLoader } from './leaderboard/leaderboard-server-loader';
import { LeaderboardSkeleton } from './leaderboard/leaderboard-skeleton';
import { LeaderboardView } from './leaderboard/leaderboard-view';
import { getMockLeaderboardDonations } from './leaderboard/mock-data';
import { PreviewDonationForm } from './preview/preview-donation-form';

export function FundraiserView({
  fundraiser,
  paymentOptions,
  paymentOptionsAreAuthenticated = false,
  leaderboardFetchStrategy = 'ssr',
  preview = false,
  previewActions,
}: {
  fundraiser: Fundraiser;
  paymentOptions?: PaymentOptions;
  paymentOptionsAreAuthenticated?: boolean;
  leaderboardFetchStrategy?: 'ssr' | 'client';
  /**
   * Renders with dummy data (mock donors, toast-only donate) for the
   * create/edit preview overlay. Public page never sets this.
   */
  preview?: boolean;
  /** Buttons appended to the main column in preview (Close / Save). */
  previewActions?: ReactNode;
}) {
  const t = useTranslations('Fundraisers');
  const locale = useLocale();

  const workspaceName = fundraiser.workspace?.name ?? '';
  const workspaceCountry = fundraiser.workspace?.country ?? '';
  const isTaxDeductible =
    getTaxDeductibilityInfo(workspaceCountry).isDeductible;
  const totalRaisedAmount = convertTotalRaisedToSingleCurrency(
    fundraiser.totalRaised,
    fundraiser.currency
  );
  const progressPercentage =
    fundraiser.goalAmount > 0
      ? Math.min(100, (totalRaisedAmount / fundraiser.goalAmount) * 100)
      : 0;
  const daysLeft = getDaysLeft(fundraiser.endDate);
  const donorScoreSettings = fundraiser.settings?.modules?.donor_score;
  const showGoal = donorScoreSettings?.show_goal ?? true;
  const showDaysLeft = donorScoreSettings?.show_days_left ?? true;

  const leaderboardSettings = fundraiser.settings?.modules?.leaderboard;
  const canShowLeaderboard =
    leaderboardSettings?.enabled &&
    (leaderboardSettings.show_recent_list || leaderboardSettings.show_top_list);
  const canReceiveDonations =
    fundraiser.canDonate &&
    paymentOptions !== undefined &&
    fundraiser.workspace !== null;

  // Preview mode has no real donations; render mock donors instead of fetching.
  const mockDonations = preview
    ? getMockLeaderboardDonations(fundraiser.currency)
    : null;
  const mockStripDonations =
    mockDonations &&
    (leaderboardSettings?.show_top_list && mockDonations.top.length > 0
      ? mockDonations.top
      : mockDonations.recent);

  return (
    <FundraiserLayout>
      <SidebarPanel>
        {/* Image */}
        <ImageDisplay
          image={fundraiser.image}
          alt={t('coverImageAlt', { title: fundraiser.title })}
        />

        {/* Title */}
        <TitleDisplay className='md:hidden' value={fundraiser.title} />

        {/* Goal progress */}
        <GoalProgressDisplay
          raisedAmount={totalRaisedAmount}
          goalAmount={fundraiser.goalAmount}
          currency={fundraiser.currency}
          progressPercentage={progressPercentage}
          daysLeft={canReceiveDonations && showDaysLeft ? daysLeft : undefined}
          showGoal={showGoal}
        />

        {/* Donation count + donor avatars (only when leaderboard module is on).
            DonorsSummary renders the count header + strip + a "View all" entry
            into the donations modal; the fallback keeps the count visible while
            the leaderboard loads. */}
        {canShowLeaderboard &&
          (preview && mockDonations && mockStripDonations ? (
            <DonorsSummaryPanel
              demo
              donations={mockStripDonations}
              donationCount={mockStripDonations.length}
              settings={leaderboardSettings!}
              idOrSlug=''
              initialRecentDonations={mockDonations.recent}
              initialTopDonations={mockDonations.top}
              totalRecentDonationCount={mockDonations.recent.length}
              totalTopDonationCount={mockDonations.top.length}
              // Re-enable pointer events + stack above the preview's modal
              // radix dialog, which otherwise blocks this body-portaled overlay.
              viewAllClassName='z-[60] pointer-events-auto'
            />
          ) : (
            <Suspense
              fallback={
                <div className='flex flex-col gap-3'>
                  <SectionHeader>
                    {t('donationCount', {
                      count: fundraiser.donationCount,
                      formattedCount: formatCompactNumber(
                        fundraiser.donationCount,
                        locale
                      ),
                    })}
                  </SectionHeader>
                  <DonorsStripSkeleton />
                </div>
              }
            >
              <DonorsSummary fundraiser={fundraiser} />
            </Suspense>
          ))}

        <div className='md:hidden flex flex-col'>
          {/** Copy link */}
          {fundraiser.visibility === 'public' && (
            <CopyLinkButton preview={preview} />
          )}
        </div>

        {/* Hosts */}
        <Hosts mode='display' fundraiser={fundraiser} />

        {/** Copy link */}
        {fundraiser.visibility === 'public' && (
          <div className='hidden md:block mt-3'>
            <CopyLinkButton preview={preview} />
          </div>
        )}
      </SidebarPanel>

      <MainPanel>
        {/* Title */}
        <TitleDisplay className='hidden md:block' value={fundraiser.title} />

        {/* Leaderboard */}
        {canShowLeaderboard &&
          (preview && mockDonations ? (
            <LeaderboardView
              demo
              initialRecentDonations={mockDonations.recent}
              initialTopDonations={mockDonations.top}
              settings={leaderboardSettings!}
            />
          ) : leaderboardFetchStrategy === 'client' ? (
            <LeaderboardClientLoader
              idOrSlug={fundraiser.slug}
              settings={leaderboardSettings}
            />
          ) : (
            <Suspense fallback={<LeaderboardSkeleton />}>
              <LeaderboardServerLoader
                idOrSlug={fundraiser.slug}
                settings={leaderboardSettings}
              />
            </Suspense>
          ))}

        {/* Donation form + overlay */}
        {preview ? (
          <>
            <PreviewDonationForm currency={fundraiser.currency} />
            <SecurityNotice
              organizationName={workspaceName}
              countryCode={workspaceCountry}
              isTaxDeductible={isTaxDeductible}
            />
          </>
        ) : canReceiveDonations ? (
          <>
            <DonationSection
              fundraiser={fundraiser}
              paymentOptions={paymentOptions}
              paymentOptionsAreAuthenticated={paymentOptionsAreAuthenticated}
            />
            <SecurityNotice
              organizationName={workspaceName}
              countryCode={workspaceCountry}
              isTaxDeductible={isTaxDeductible}
            />
          </>
        ) : (
          <ClosedForContribution
            message={
              typeof fundraiser.metadata?.closedMessage === 'string'
                ? fundraiser.metadata.closedMessage
                : undefined
            }
          />
        )}

        {/* Description */}
        <DescriptionDisplay value={fundraiser.description} />

        {/* Project allocations */}
        <ProjectsSupportedDisplay
          projectAllocations={fundraiser.projectAllocations}
        />

        {preview && previewActions && (
          <div className='flex flex-wrap gap-3'>{previewActions}</div>
        )}
      </MainPanel>
    </FundraiserLayout>
  );
}
