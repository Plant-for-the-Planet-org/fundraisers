'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useController } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GoalPreview } from '@/components/fundraisers/goal-preview';
import { SectionOffNotice } from '@/components/fundraisers/section-off-notice';
import { SectionHeader } from '@/components/fundraisers/typography';
import { Switch } from '@/components/ui/switch';
import { GoalSettingsDropdown } from './goal-settings-dropdown';

interface GoalSettingsProps {
  isEditMode: boolean;
  totalRaised?: number;
  endDate?: string;
}

export function GoalSettings({
  isEditMode,
  totalRaised,
  endDate,
}: GoalSettingsProps) {
  const t = useTranslations('Fundraisers.form.goalSettings');
  const { field: enabled } = useController<
    FundraiserFormValues,
    'settings.modules.donor_score.enabled'
  >({ name: 'settings.modules.donor_score.enabled' });

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={
          <div className='flex items-center gap-2'>
            <Switch
              size='compact'
              checked={enabled.value}
              onCheckedChange={enabled.onChange}
              aria-label={t('enableGoal')}
            />
            <GoalSettingsDropdown />
          </div>
        }
      >
        {t('sectionHeading')}
      </SectionHeader>
      {/* Both share one grid cell so the block keeps the same height when the switch flips. */}
      <div className='grid'>
        <div
          className={cn('[grid-area:1/1]', !enabled.value && 'invisible')}
          inert={!enabled.value}
        >
          <GoalPreview
            isEditMode={isEditMode}
            totalRaised={totalRaised}
            endDate={endDate}
          />
        </div>
        <SectionOffNotice
          title={t('hiddenView.title')}
          description={t('hiddenView.description')}
          className={cn('[grid-area:1/1]', enabled.value && 'invisible')}
        />
      </div>
    </div>
  );
}
