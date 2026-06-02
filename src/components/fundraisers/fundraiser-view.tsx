import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { getTaxDeductibilityInfo } from '@/lib/utils/country-currency';
import { getDaysLeft, getTotalRaisedByCurrency } from '@/lib/utils/fundraiser';
import { ClosedForContribution } from '@/components/fundraisers/closed-for-contribution';
import DescriptionDisplay from '@/components/fundraisers/description-display';
import { DonationSection } from '@/components/fundraisers/donation-section';
import { DonorsStripSkeleton } from '@/components/fundraisers/donors-strip';
import { DonorsSummary } from '@/components/fundraisers/donors-summary';
import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';
import { Hosts } from '@/components/fundraisers/hosts';
import ImageDisplay from '@/components/fundraisers/image-display';
import { MultiCurrencyRaisedDisplay } from '@/components/fundraisers/multi-currency-raised-display';
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

function DonationCountSummary({
  donationCount,
  fundraiser,
}: {
  donationCount: number;
  fundraiser: Fundraiser;
}) {
  const t = useTranslations('Fundraisers');

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>
        {t('donationCount', {
          count: donationCount,
          formattedCount: donationCount.toLocaleString(),
        })}
      </SectionHeader>
      <Suspense fallback={<DonorsStripSkeleton />}>
        <DonorsSummary fundraiser={fundraiser} />
      </Suspense>
    </div>
  );
}

export function FundraiserView({
  fundraiser,
  paymentOptions,
  paymentOptionsAreAuthenticated = false,
  leaderboardFetchStrategy = 'ssr',
}: {
  fundraiser: Fundraiser;
  paymentOptions?: PaymentOptions;
  paymentOptionsAreAuthenticated?: boolean;
  leaderboardFetchStrategy?: 'ssr' | 'client';
}) {
  const t = useTranslations('Fundraisers');
  const locale = useLocale();

  const workspaceName = fundraiser.workspace?.name ?? '';
  const workspaceCountry = fundraiser.workspace?.country ?? '';
  const isTaxDeductible =
    getTaxDeductibilityInfo(workspaceCountry).isDeductible;
  const totalRaisedByCurrency = getTotalRaisedByCurrency(
    fundraiser.totalRaised
  );
  const isMultiCurrency = totalRaisedByCurrency.length > 1;
  const singleRaisedAmount = !isMultiCurrency
    ? (totalRaisedByCurrency[0]?.amount ?? 0)
    : 0;
  const progressPercentage =
    !isMultiCurrency && fundraiser.goalAmount > 0
      ? Math.min(100, (singleRaisedAmount / fundraiser.goalAmount) * 100)
      : 0;
  const daysLeft = getDaysLeft(fundraiser.endDate);
  const leaderboardSettings = fundraiser.settings?.modules?.leaderboard;
  const canShowLeaderboard =
    leaderboardSettings?.enabled &&
    (leaderboardSettings.show_recent_list || leaderboardSettings.show_top_list);

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
        {isMultiCurrency ? (
          <MultiCurrencyRaisedDisplay
            totalRaisedEntries={totalRaisedByCurrency}
          />
        ) : (
          <GoalProgressDisplay
            raisedAmount={singleRaisedAmount}
            goalAmount={fundraiser.goalAmount}
            currency={fundraiser.currency}
            progressPercentage={progressPercentage}
            daysLeft={daysLeft}
          />
        )}

        {/* Donation count + donor avatars (only when leaderboard module is on) */}
        {canShowLeaderboard && (
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
            <Suspense fallback={<DonorsStripSkeleton />}>
              <DonorsSummary fundraiser={fundraiser} />
            </Suspense>
          </div>
        )}

        {/* Hosts */}
        <Hosts mode='display' fundraiser={fundraiser} />

        {/** Copy link */}
        {fundraiser.visibility === 'public' && (
          <div className='hidden md:block'>
            <CopyLinkButton />
          </div>
        )}
      </SidebarPanel>

      <MainPanel>
        {/* Title */}
        <TitleDisplay className='hidden md:block' value={fundraiser.title} />

        {/* Leaderboard */}
        {canShowLeaderboard &&
          (leaderboardFetchStrategy === 'client' ? (
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
        {fundraiser.canDonate && paymentOptions && fundraiser.workspace ? (
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
          bundleSlug={fundraiser.settings?.modules?.bundle?.slug ?? null}
        />
      </MainPanel>

      {(canShowLeaderboard || fundraiser.visibility === 'public') && (
        <div className='md:hidden flex flex-col gap-6'>
          {/* Donation count + donor avatars (only when leaderboard module is on) */}
          {canShowLeaderboard && (
            <DonationCountSummary
              donationCount={fundraiser.donationCount}
              fundraiser={fundraiser}
            />
          )}

          {/** Copy link */}
          {fundraiser.visibility === 'public' && <CopyLinkButton />}
        </div>
      )}
    </FundraiserLayout>
  );
}
