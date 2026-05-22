'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollingDonationList } from './scrolling-donation-list';
import { ViewAllOverlay } from './view-all-overlay';

interface LeaderboardViewProps {
  idOrSlug: string;
  initialRecentDonations: LeaderboardDonation[];
  initialTopDonations: LeaderboardDonation[];
  totalRecentDonationCount: number;
  totalTopDonationCount: number;
  settings: LeaderboardModuleSettings;
}

export function LeaderboardView({
  idOrSlug,
  initialRecentDonations,
  initialTopDonations,
  totalRecentDonationCount,
  totalTopDonationCount,
  settings,
}: LeaderboardViewProps) {
  const {
    show_recent_list,
    show_top_list,
    view_all,
    anonymize,
    show_amount,
    show_avatar,
    default_tab,
    aggregate_top_by_donor,
  } = settings;

  const t = useTranslations('Leaderboard.view');
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>(default_tab);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const effectiveTab =
    activeTab === 'recent' && !show_recent_list
      ? 'top'
      : activeTab === 'top' && !show_top_list
        ? 'recent'
        : activeTab;

  return (
    <div className='leaderboard-view w-full flex flex-col gap-4'>
      <Tabs
        value={effectiveTab}
        onValueChange={value => setActiveTab(value as 'recent' | 'top')}
      >
        <SectionHeader
          className='flex-row items-center justify-between'
          showDivider={false}
          actionSlot={
            (show_recent_list || show_top_list) && (
              <TabsList>
                {show_recent_list && (
                  <TabsTrigger value='recent'>{t('tabs.latest')}</TabsTrigger>
                )}
                {show_top_list && (
                  <TabsTrigger value='top'>
                    {aggregate_top_by_donor
                      ? t('tabs.topDonors')
                      : t('tabs.topDonations')}
                  </TabsTrigger>
                )}
              </TabsList>
            )
          }
        >
          {t('title')}
        </SectionHeader>

        {show_recent_list && (
          <TabsContent value='recent' className='mt-0'>
            <ScrollingDonationList
              initialDonations={initialRecentDonations}
              isActive={effectiveTab === 'recent'}
              anonymize={anonymize}
              showAmount={show_amount}
              showAvatar={show_avatar}
            />
          </TabsContent>
        )}
        {show_top_list && (
          <TabsContent value='top' className='mt-0'>
            <ScrollingDonationList
              initialDonations={initialTopDonations}
              isActive={effectiveTab === 'top'}
              anonymize={anonymize}
              showAmount={show_amount}
              showAvatar={show_avatar}
              showDate={!aggregate_top_by_donor}
            />
          </TabsContent>
        )}

        {view_all && (
          <div className='flex justify-end'>
            <Button
              variant='text'
              className='text-sm font-semibold leading-tight p-0 h-auto'
              onClick={() => setIsViewAllOpen(true)}
            >
              {t('viewAll')}
            </Button>
          </div>
        )}
      </Tabs>

      <ViewAllOverlay
        idOrSlug={idOrSlug}
        isOpen={isViewAllOpen}
        onClose={closedTab => {
          setIsViewAllOpen(false);
          setActiveTab(closedTab);
        }}
        initialRecentDonations={initialRecentDonations}
        initialTopDonations={initialTopDonations}
        totalRecentDonationCount={totalRecentDonationCount}
        totalTopDonationCount={totalTopDonationCount}
        activeTab={effectiveTab}
        showRecentList={show_recent_list}
        showTopList={show_top_list}
        anonymize={anonymize}
        showAmount={show_amount}
        showAvatar={show_avatar}
        aggregateTopByDonor={aggregate_top_by_donor}
      />
    </div>
  );
}
