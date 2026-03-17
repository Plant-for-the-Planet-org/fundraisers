'use client';

import DescriptionDisplay from '@/components/fundraisers/description-display';
import { DonationForm } from '@/components/fundraisers/donation-form';
import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import TitleDisplay from '@/components/fundraisers/title-display';
import { SectionHeader } from '@/components/fundraisers/typography';
import ImageDisplay from '@/components/fundraisers/image-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { HostPreview } from '@/components/fundraisers/host-preview';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
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

export function FundraiserView({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Fundraisers');

  const progressPercent =
    fundraiser.goalAmount > 0
      ? Math.min(100, (fundraiser.totalRaised / fundraiser.goalAmount) * 100)
      : 0;
  const daysLeft = getDaysLeft(fundraiser.endDate);

  const contribution = fundraiser.settings?.modules?.contribution;

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

        {/* Donation form */}
        <DonationForm
          currency={fundraiser.currency}
          contributionSettings={
            contribution
              ? {
                  allow_dedication: contribution.allow_dedication,
                  allow_recurrency: contribution.allow_recurrency,
                }
              : undefined
          }
          onDonate={() => {}}
        />

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
