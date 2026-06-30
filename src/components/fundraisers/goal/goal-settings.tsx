'use client';

import { useTranslations } from 'next-intl';
import { GoalPreview } from '@/components/fundraisers/goal-preview';
import { SectionHeader } from '@/components/fundraisers/typography';
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

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={<GoalSettingsDropdown />}
      >
        {t('sectionHeading')}
      </SectionHeader>
      <GoalPreview
        isEditMode={isEditMode}
        totalRaised={totalRaised}
        endDate={endDate}
      />
    </div>
  );
}
