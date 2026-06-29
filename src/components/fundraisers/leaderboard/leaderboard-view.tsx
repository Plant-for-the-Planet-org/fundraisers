'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveActiveTab } from './resolve-tab';
import { ScrollingDonationList } from './scrolling-donation-list';

interface LeaderboardViewProps {
  initialRecentDonations: LeaderboardDonation[];
  initialTopDonations: LeaderboardDonation[];
  settings: LeaderboardModuleSettings;
  demo?: boolean;
}

export function LeaderboardView({
  initialRecentDonations,
  initialTopDonations,
  settings,
  demo = false,
}: LeaderboardViewProps) {
  const {
    show_recent_list,
    show_top_list,
    anonymize,
    show_amount,
    show_avatar,
    default_tab,
    aggregate_top_by_donor,
  } = settings;

  const t = useTranslations('Leaderboard.view');
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>(default_tab);

  const resolvedTab = resolveActiveTab(activeTab, settings);

  const shouldShowTabs = show_recent_list && show_top_list;

  let sectionTitle = t('title');
  if (!shouldShowTabs) {
    if (show_recent_list) sectionTitle = t('titleRecent');
    else if (aggregate_top_by_donor) sectionTitle = t('tabs.topDonors');
    else sectionTitle = t('tabs.topDonations');
  }

  return (
    <div className='leaderboard-view w-full flex flex-col gap-4'>
      <Tabs
        value={resolvedTab}
        onValueChange={value => setActiveTab(value as 'recent' | 'top')}
      >
        <SectionHeader
          className='flex-row items-center justify-between'
          showDivider={false}
          actionSlot={
            shouldShowTabs && (
              <TabsList>
                <TabsTrigger value='recent'>{t('tabs.latest')}</TabsTrigger>
                <TabsTrigger value='top'>
                  {aggregate_top_by_donor
                    ? t('tabs.topDonors')
                    : t('tabs.topDonations')}
                </TabsTrigger>
              </TabsList>
            )
          }
        >
          <span className='flex items-center gap-2'>
            {sectionTitle}
            {demo && (
              <span className='text-xs font-normal text-muted-foreground'>
                {t('demoData')}
              </span>
            )}
          </span>
        </SectionHeader>

        {show_recent_list && (
          <TabsContent value='recent' className='mt-0'>
            <ScrollingDonationList
              initialDonations={initialRecentDonations}
              isActive={resolvedTab === 'recent'}
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
              isActive={resolvedTab === 'top'}
              anonymize={anonymize}
              showAmount={show_amount}
              showAvatar={show_avatar}
              showDate={!aggregate_top_by_donor}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
