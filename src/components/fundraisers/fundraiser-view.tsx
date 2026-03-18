import { DonationSection } from '@/components/fundraisers/donation-section';
import { ClosedForContribution } from '@/components/fundraisers/closed-for-contribution';
import { SecurityNotice } from '@/components/fundraisers/security-notice';
import DescriptionDisplay from '@/components/fundraisers/description-display';
import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import TitleDisplay from '@/components/fundraisers/title-display';
import ImageDisplay from '@/components/fundraisers/image-display';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { HostPreview } from '@/components/fundraisers/host-preview';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import { getTaxDeductibilityInfo } from '@/lib/utils/country-currency';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
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

  const progressPercent =
    fundraiser.goalAmount > 0
      ? Math.min(100, (fundraiser.totalRaised / fundraiser.goalAmount) * 100)
      : 0;
  const daysLeft = getDaysLeft(fundraiser.endDate);
  const workspaceName = fundraiser.workspace?.name ?? '';
  const workspaceCountry = fundraiser.workspace?.country ?? '';
  const isTaxDeductible =
    getTaxDeductibilityInfo(workspaceCountry).isDeductible;

  return (
    <FundraiserLayout>
      <SidebarPanel>
        {/* Image */}
        <ImageDisplay
          image={fundraiser.image}
          alt={t('coverImageAlt', { title: fundraiser.title })}
        />

        {/* Stats */}
        <div className='flex flex-col'>
          <div className='text-zinc-800 dark:text-gray-100 text-lg font-bold'>
            {t('create.goalPreview.raised', {
              amount: formatCurrencyFromDecimal(
                fundraiser.totalRaised,
                fundraiser.currency
              ),
            })}
          </div>
          <div className='mt-2'>
            <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden'>
              <div
                className='h-full bg-green-600'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className='mt-2 flex items-center justify-between text-sm text-zinc-800 dark:text-gray-300'>
            <div>
              {t('create.goalPreview.goalLine', {
                amount: formatCurrencyFromDecimal(
                  fundraiser.goalAmount,
                  fundraiser.currency
                ),
              })}
            </div>
            <div>{t('create.goalPreview.daysLeft', { days: daysLeft })}</div>
          </div>
        </div>

        {/* Donation count */}
        <div className='text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight'>
          {t('donationCount', {
            count: fundraiser.donationCount,
            formattedCount: fundraiser.donationCount.toLocaleString(),
          })}
        </div>

        {/* Hosts */}
        <HostPreview mode='read' fundraiser={fundraiser} />
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
