'use client';

import type { FundraiserFormValues } from '../fundraiser-form-schema';
import type { BooleanLeaderboardKey } from './leaderboard-settings-dropdown';

import { useController } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '../typography';
import { DisabledView } from './disabled-view';
import { LeaderboardSettingsDropdown } from './leaderboard-settings-dropdown';
import { NoTabsWarning } from './no-tabs-warning';

export function LeaderboardSettings() {
  const t = useTranslations('Leaderboard.form');

  const { field } = useController<
    FundraiserFormValues,
    'settings.modules.leaderboard'
  >({
    name: 'settings.modules.leaderboard',
  });

  const settings = field.value;

  const handleChange = (
    key: BooleanLeaderboardKey | 'enabled',
    checked: boolean
  ) => {
    field.onChange({ ...settings, [key]: checked });
  };

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
        !(settings.show_recent_list || settings.show_top_list) && (
          <NoTabsWarning />
        )}
    </div>
  );
}
