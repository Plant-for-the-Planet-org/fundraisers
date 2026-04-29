import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { getTaxDeductibilityInfo } from '@/lib/utils/country-currency';
import { getDaysLeft } from '@/lib/utils/fundraiser';
import { ClosedForContribution } from '@/components/fundraisers/closed-for-contribution';
import DescriptionDisplay from '@/components/fundraisers/description-display';
import { DonationSection } from '@/components/fundraisers/donation-section';
import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';
import { Hosts } from '@/components/fundraisers/hosts';
import ImageDisplay from '@/components/fundraisers/image-display';
import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import { SecurityNotice } from '@/components/fundraisers/security-notice';
import TitleDisplay from '@/components/fundraisers/title-display';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { CopyLinkButton } from './copy-link-button';
import {
  LeaderboardLoader,
  LeaderboardSkeleton,
} from './leaderboard/leaderboard-loader';

export function FundraiserView({
  fundraiser,
  paymentOptions,
}: {
  fundraiser: Fundraiser;
  paymentOptions?: PaymentOptions;
}) {
  const t = useTranslations('Fundraisers');

  const workspaceName = fundraiser.workspace?.name ?? '';
  const workspaceCountry = fundraiser.workspace?.country ?? '';
  const isTaxDeductible =
    getTaxDeductibilityInfo(workspaceCountry).isDeductible;
  const progressPercentage =
    fundraiser.goalAmount > 0
      ? Math.min(100, (fundraiser.totalRaised / fundraiser.goalAmount) * 100)
      : 0;
  const daysLeft = getDaysLeft(fundraiser.endDate);

  return (
    <FundraiserLayout>
      <SidebarPanel>
        {/* Image */}
        <ImageDisplay
          image={fundraiser.image}
          alt={t('coverImageAlt', { title: fundraiser.title })}
        />

        {/* Goal progress */}
        <GoalProgressDisplay
          raisedAmount={fundraiser.totalRaised}
          goalAmount={fundraiser.goalAmount}
          currency={fundraiser.currency}
          progressPercentage={progressPercentage}
          daysLeft={daysLeft}
        />

        {/* Donation count */}
        <div className='text-foreground text-sm font-semibold leading-tight'>
          {t('donationCount', {
            count: fundraiser.donationCount,
            formattedCount: fundraiser.donationCount.toLocaleString(),
          })}
        </div>

        {/* Hosts */}
        <Hosts mode='display' fundraiser={fundraiser} />
        {/** Copy link */}
        {fundraiser.visibility === 'public' && <CopyLinkButton />}
      </SidebarPanel>

      <MainPanel>
        {/* Title */}
        <TitleDisplay value={fundraiser.title} />

        {/* Leaderboard */}
        {fundraiser.settings?.modules?.leaderboard?.enabled && (
          <Suspense fallback={<LeaderboardSkeleton />}>
            <LeaderboardLoader
              idOrSlug={fundraiser.slug}
              settings={fundraiser.settings.modules.leaderboard}
            />
          </Suspense>
        )}

        {/* Donation form + overlay */}
        {fundraiser.canDonate && paymentOptions ? (
          <>
            <DonationSection
              fundraiser={fundraiser}
              paymentOptions={paymentOptions}
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
      </MainPanel>
    </FundraiserLayout>
  );
}
