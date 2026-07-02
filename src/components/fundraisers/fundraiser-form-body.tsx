'use client';

import type { ReactNode } from 'react';
import type { FundraiserHost } from '@/lib/types/fundraiser';

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
import { HostsManager } from './hosts-manager';
import { ImageSelector } from './image-selector';
import { LeaderboardSettings } from './leaderboard/leaderboard-settings';
import { Options } from './options';
import { SlugField } from './slug-field';
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
  /** Currently saved slug. Drives the inline link editor in edit mode. */
  savedSlug?: string;
  /** Fundraiser id. Required in edit mode to manage hosts. */
  fundraiserId?: string;
  /** Existing hosts. Only meaningful in edit mode. */
  hosts?: FundraiserHost[];
}

export function FundraiserFormBody({
  mode,
  submitButton,
  totalRaised,
  endDate,
  savedSlug,
  fundraiserId,
  hosts,
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
        {isEditMode && fundraiserId ? (
          <HostsManager
            fundraiserId={fundraiserId}
            initialHosts={hosts ?? []}
          />
        ) : (
          <Hosts mode='preview' />
        )}
        <ThemeSettings />
      </SidebarPanel>
      <MainPanel>
        <Title />
        {isEditMode && savedSlug && <SlugField savedSlug={savedSlug} />}
        <LeaderboardSettings />
        <ContributionSettings />
        <DescriptionInput />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <WorkspaceSelector disabled={isEditMode} />
          <GoalInput />
        </div>
        <WorkspaceInfo />
        <BundleSelection mode={mode} />
        <Options />
        {submitButton}
      </MainPanel>
    </FundraiserLayout>
  );
}
