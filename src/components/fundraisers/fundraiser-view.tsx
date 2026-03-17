import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import { DonationSection } from '@/components/fundraisers/donation-section';
import { ClosedForContribution } from '@/components/fundraisers/closed-for-contribution';
import { SecurityNotice } from '@/components/fundraisers/security-notice';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getImageUrl } from '@/lib/utils/images';
import { Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import DescriptionDisplay from '@/components/fundraisers/description-display';

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

  const publicHosts = fundraiser.hosts.filter(h => h.isPublic);

  return (
    <FundraiserLayout>
      <SidebarPanel>
        {/* Image */}
        <div className='self-stretch h-80 relative rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-800'>
          {fundraiser.image ? (
            <img
              src={fundraiser.image}
              alt={t('coverImageAlt', { title: fundraiser.title })}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <Target className='w-16 h-16 text-gray-400' />
            </div>
          )}
        </div>

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
        <h1
          className='text-4xl font-bold'
          style={{ fontFamily: 'var(--theme-title-font)' }}
        >
          {fundraiser.title}
        </h1>

        {/* Donation form + overlay */}
        {fundraiser.canDonate && paymentOptions ? (
          <>
            <DonationSection
              fundraiser={fundraiser}
              paymentOptions={paymentOptions}
            />
            <SecurityNotice
              organizationName={fundraiser.workspace?.name ?? ''}
              countryCode={fundraiser.workspace?.country ?? ''}
              isTaxDeductible={paymentOptions.taxDeductionCountries.includes(
                fundraiser.workspace?.country ?? ''
              )}
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
