'use client';

import DescriptionDisplay from '@/components/fundraisers/description-display';
import { DonationForm } from '@/components/fundraisers/donation-form';
import { GoalPreview } from '@/components/fundraisers/goal-preview';
import { ProjectsSupportedDisplay } from '@/components/fundraisers/projects-supported-display';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { Target } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FundraiserView({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Fundraisers');

  const publicHosts = fundraiser.hosts.filter(h => h.isPublic);

  const contribution = fundraiser.settings?.modules?.contribution;

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
        <GoalPreview mode='read' fundraiser={fundraiser} />

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
