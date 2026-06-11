'use client';

import type { FundraiserFormValues } from '../fundraiser-form-schema';
import type { BooleanLeaderboardKey } from './leaderboard-settings-dropdown';

import { useController, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '../typography';
import { DisabledView } from './disabled-view';
import { useEditLeaderboard } from './edit-leaderboard-context';
import { LeaderboardSettingsDropdown } from './leaderboard-settings-dropdown';
import { LeaderboardSkeleton } from './leaderboard-skeleton';
import { LeaderboardView } from './leaderboard-view';
import { getMockLeaderboardDonations } from './mock-data';
import { NoTabsWarning } from './no-tabs-warning';

export function LeaderboardSettings() {
  const t = useTranslations('Leaderboard.form');

  const { field } = useController<
    FundraiserFormValues,
    'settings.modules.leaderboard'
  >({
    name: 'settings.modules.leaderboard',
  });

  const currency = useWatch<FundraiserFormValues, 'currency'>({
    name: 'currency',
  });

  // In edit mode this holds the fundraiser's real leaderboard data; null in create mode.
  const editLeaderboard = useEditLeaderboard();

  const settings = field.value;

  const handleChange = (
    key: BooleanLeaderboardKey | 'enabled',
    checked: boolean
  ) => {
    field.onChange({ ...settings, [key]: checked });
  };

  const { recent: mockRecent, top: mockTop } =
    getMockLeaderboardDonations(currency);
  const hasActiveTabs = settings.show_recent_list || settings.show_top_list;

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={
          <div className='flex items-center gap-2'>
            <Switch
              size='compact'
              checked={settings.enabled}
              onCheckedChange={checked => handleChange('enabled', checked)}
              aria-label={t('labels.enableLeaderboard')}
            />
            <LeaderboardSettingsDropdown
              settings={settings}
              onChange={handleChange}
            />
          </div>
        }
      >
        {t('sectionHeading')}
      </SectionHeader>

      {!settings.enabled && <DisabledView />}
      {settings.enabled &&
        (hasActiveTabs ? (
          editLeaderboard?.isLoading ? (
            <LeaderboardSkeleton />
          ) : editLeaderboard && editLeaderboard.hasRealDonations ? (
            <LeaderboardView
              idOrSlug={editLeaderboard.idOrSlug}
              initialRecentDonations={editLeaderboard.recent}
              initialTopDonations={editLeaderboard.top}
              totalRecentDonationCount={editLeaderboard.recentTotal}
              totalTopDonationCount={editLeaderboard.topTotal}
              settings={settings}
            />
          ) : (
            <LeaderboardView
              idOrSlug=''
              initialRecentDonations={mockRecent}
              initialTopDonations={mockTop}
              totalRecentDonationCount={mockRecent.length}
              totalTopDonationCount={mockTop.length}
              settings={settings}
            />
          )
        ) : (
          <NoTabsWarning />
        ))}
    </div>
  );
}
