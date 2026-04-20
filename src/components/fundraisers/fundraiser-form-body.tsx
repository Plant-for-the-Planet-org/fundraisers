'use client';

import type { ReactNode } from 'react';
import type { SelectedProject } from '@/lib/types/project-selection';

import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { ContributionSettings } from './contribution-settings';
import DescriptionInput from './description-input';
import { DonorsPreview } from './donors-preview';
import { GoalInput } from './goal-input';
import { GoalPreview } from './goal-preview';
import { Hosts } from './hosts';
import { ImageSelector } from './image-selector';
import { Options } from './options';
import { ProjectSelection } from './project-selection';
import { ThemeSettings } from './theme-settings';
import { Title } from './title';
import { WorkspaceInfo } from './workspace-info';
import { WorkspaceSelector } from './workspace-selector';

interface FundraiserFormBodyProps {
  mode: 'create' | 'edit';
  submitButton: ReactNode;
  initialExtraProjects?: SelectedProject[];
}

export function FundraiserFormBody({
  mode,
  submitButton,
  initialExtraProjects,
}: FundraiserFormBodyProps) {
  const isEdit = mode === 'edit';

  return (
    <FundraiserLayout>
      <SidebarPanel>
        <ImageSelector autoLoadDefault={!isEdit} />
        <GoalPreview />
        <DonorsPreview />
        <Hosts mode='preview' />
        <ThemeSettings />
      </SidebarPanel>
      <MainPanel>
        <Title />
        <ContributionSettings />
        <DescriptionInput />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <WorkspaceSelector disabled={isEdit} />
          <GoalInput />
        </div>
        <WorkspaceInfo />
        <ProjectSelection initialExtraProjects={initialExtraProjects} />
        <Options />
        {submitButton}
      </MainPanel>
    </FundraiserLayout>
  );
}
