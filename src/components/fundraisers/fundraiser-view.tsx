import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { ClosedForContribution } from '@/components/fundraisers/closed-for-contribution';
import DescriptionDisplay from '@/components/fundraisers/description-display';
import { DonationSection } from '@/components/fundraisers/donation-section';
import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';
import ImageDisplay from '@/components/fundraisers/image-display';
import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import { SecurityNotice } from '@/components/fundraisers/security-notice';
import TitleDisplay from '@/components/fundraisers/title-display';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { getTaxDeductibilityInfo } from '@/lib/utils/country-currency';
import { getImageUrl } from '@/lib/utils/images';
import { useTranslations } from 'next-intl';

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function FundraiserView({
  fundraiser,
  paymentOptions,
}: {
  fundraiser: Fundraiser;
  paymentOptions?: PaymentOptions;
}) {
  const t = useTranslations('Fundraisers');

  const publicHosts = fundraiser.hosts.filter(h => h.isPublic);
  const workspaceName = fundraiser.workspace?.name ?? '';
  const workspaceCountry = fundraiser.workspace?.country ?? '';
  const isTaxDeductible =
    getTaxDeductibilityInfo(workspaceCountry).isDeductible;
  const goalProgress =
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
          progress={goalProgress}
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
        {publicHosts.length > 0 && (
          <div className='flex flex-col gap-3'>
            <SectionHeader>{t('hostedByLabel')}</SectionHeader>
            <div className='flex flex-col gap-2'>
              {publicHosts.map(host => {
                const hostName =
                  host.displayName ?? host.user?.name ?? t('unknownHost');
                const avatarUrl = host.user?.avatar
                  ? getImageUrl('profile', 'thumb', host.user.avatar)
                  : null;
                return (
                  <div
                    key={host.id}
                    className='flex flex-row items-center gap-2.5'
                  >
                    <Avatar className='h-6 w-6'>
                      {avatarUrl && (
                        <AvatarImage
                          src={avatarUrl}
                          alt={hostName}
                          loading='lazy'
                        />
                      )}
                      <AvatarFallback className='bg-linear-to-br from-blue-500 to-purple-600' />
                    </Avatar>
                    <div className='text-zinc-800 dark:text-gray-100 text-base font-medium leading-tight'>
                      {hostName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SidebarPanel>

      <MainPanel>
        {/* Title */}
        <TitleDisplay value={fundraiser.title} />

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
