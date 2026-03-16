'use client';

import { useTranslations } from 'next-intl';
import { Target } from 'lucide-react';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Title } from '@/components/fundraisers/title';
import { DonationForm } from '@/components/fundraisers/donation-form';
import TitleDisplay from '@/components/fundraisers/title-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getImageUrl } from '@/lib/utils/images';

function getProjectImageSource(image?: string): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return getImageUrl('project', 'small', image);
}

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
        {fundraiser.description && (
          <div className='flex flex-col gap-3'>
            <SectionHeader>{t('create.description.label')}</SectionHeader>
            <div
              className='text-sm text-foreground leading-relaxed [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-6 [&_ol]:list-decimal [&_li]:my-1 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through'
              dangerouslySetInnerHTML={{ __html: fundraiser.description }}
            />
          </div>
        )}

        {/* Project allocations */}
        {fundraiser.projectAllocations.length > 0 && (
          <div className='flex flex-col gap-3'>
            <SectionHeader>
              {t('create.projectSelection.sectionHeading')}
            </SectionHeader>
            <div className='space-y-4'>
              {fundraiser.projectAllocations.map((allocation, index) => {
                const project = allocation.project;
                const imageSource = getProjectImageSource(project.image);
                const isLast =
                  index === fundraiser.projectAllocations.length - 1;
                return (
                  <div key={project.id}>
                    <div className='flex gap-4'>
                      <div className='w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                        {imageSource ? (
                          <img
                            src={imageSource}
                            alt={t('create.projectSelection.projectImageAlt', {
                              name: project.name,
                            })}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <Target className='w-6 h-6 text-gray-400' />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-zinc-800 dark:text-gray-100 text-base font-semibold leading-tight'>
                          {project.name}
                        </p>
                        <p className='text-zinc-800 dark:text-gray-100 text-base font-normal leading-tight mt-1 line-clamp-3'>
                          {project.description}
                        </p>
                        <span className='text-sm text-green-600 font-medium'>
                          {t('create.projectSelection.allocationLabel', {
                            percentage: allocation.percentage,
                          })}
                        </span>
                      </div>
                    </div>
                    {!isLast && (
                      <div className='mt-3 h-px bg-gray-200 dark:bg-gray-700' />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </MainPanel>
    </FundraiserLayout>
  );
}
