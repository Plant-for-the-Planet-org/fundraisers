'use client';

import type { ReactNode } from 'react';

import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { BundleSelection } from './bundle-selection/bundle-selection';
import { ContributionSettings } from './contribution-settings';
import DescriptionInput from './description-input';
import { DonorsPreview } from './donors-preview';
import { GoalSettings } from './goal/goal-settings';
import { GoalInput } from './goal-input';
import { Hosts } from './hosts';
import { ImageSelector } from './image-selector';
import { LeaderboardSettings } from './leaderboard/leaderboard-settings';
import { Options } from './options';
import { ThemeSettings } from './theme-settings';
import { Title } from './title';
import { WorkspaceInfo } from './workspace-info';
import { WorkspaceSelector } from './workspace-selector';

interface FundraiserFormBodyProps {
  mode: 'create' | 'edit';
  submitButton: ReactNode;
  /** Server-reported raised amount. Only meaningful in edit mode. */
  totalRaised?: number;
  /** Fundraiser end date (ISO string). Only meaningful in edit mode. */
  endDate?: string;
}

export function FundraiserFormBody({
  mode,
  submitButton,
  totalRaised,
  endDate,
}: FundraiserFormBodyProps) {
  const isEditMode = mode === 'edit';

  return (
    <FundraiserLayout>
      <SidebarPanel>
        <ImageSelector autoLoadDefault={!isEditMode} />
        <GoalSettings
          isEditMode={isEditMode}
          totalRaised={totalRaised}
          endDate={endDate}
        />
        <DonorsPreview />
        <Hosts mode='preview' />
        <ThemeSettings />
      </SidebarPanel>
      <MainPanel>
        <Title />
        <LeaderboardSettings />
        <GoalInput />
        <ContributionSettings />
        <DescriptionInput />
        <WorkspaceSelector disabled={isEditMode} />
        <WorkspaceInfo />
        <BundleSelection mode={mode} />
        <Options />
        {submitButton}
      </MainPanel>
    </FundraiserLayout>
  );
}
