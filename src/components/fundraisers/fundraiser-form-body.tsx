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
import { StickyFormBar } from './sticky-form-bar';
import { ThemeSettings } from './theme-settings';
import { Title } from './title';
import { ViewButton } from './view-button';
import { WorkspaceInfo } from './workspace-info';
import { WorkspaceSelector } from './workspace-selector';

interface FundraiserFormBodyProps {
  mode: 'create' | 'edit';
  submitButton: ReactNode;
  /** Fundraiser slug for the View link. Only meaningful in edit mode. */
  slug?: string;
  /** Server-reported raised amount. Only meaningful in edit mode. */
  totalRaised?: number;
  /** Fundraiser end date (ISO string). Only meaningful in edit mode. */
  endDate?: string;
  /** Fundraiser id. Required in edit mode to manage hosts. */
  fundraiserId?: string;
  /** Existing hosts. Only meaningful in edit mode. */
  hosts?: FundraiserHost[];
}

export function FundraiserFormBody({
  mode,
  submitButton,
  slug,
  totalRaised,
  endDate,
  fundraiserId,
  hosts,
}: FundraiserFormBodyProps) {
  const isEditMode = mode === 'edit';

  return (
    // On mobile both panels merge into one column, ordered like the public page: title and hosts first, then goal and donors, then the contribution form. Desktop keeps the two-column source order.
    <FundraiserLayout>
      <SidebarPanel flattenOnMobile>
        <div className='max-md:order-1 empty:hidden'>
          <ImageSelector autoLoadDefault={!isEditMode} />
        </div>
        <div className='max-md:order-5 empty:hidden'>
          <GoalSettings
            isEditMode={isEditMode}
            totalRaised={totalRaised}
            endDate={endDate}
          />
        </div>
        <div className='max-md:order-6 empty:hidden'>
          <DonorsPreview />
        </div>
        <div className='max-md:order-4 empty:hidden'>
          {isEditMode && fundraiserId ? (
            <HostsManager
              fundraiserId={fundraiserId}
              initialHosts={hosts ?? []}
            />
          ) : (
            <Hosts mode='preview' />
          )}
        </div>
        <div className='max-md:order-13 empty:hidden'>
          <ThemeSettings />
        </div>
      </SidebarPanel>
      <MainPanel flattenOnMobile>
        <div className='max-md:order-2'>
          <Title />
        </div>
        {isEditMode && (
          <div className='max-md:order-3'>
            <SlugField />
          </div>
        )}
        <div className='max-md:order-8 empty:hidden'>
          <LeaderboardSettings />
        </div>
        <div className='max-md:order-7 empty:hidden'>
          <ContributionSettings />
        </div>
        <div className='max-md:order-9'>
          <DescriptionInput />
        </div>
        <div className='max-md:order-10 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <WorkspaceSelector disabled={isEditMode} />
          <GoalInput />
        </div>
        <div className='max-md:order-11 empty:hidden'>
          <WorkspaceInfo />
        </div>
        <div className='max-md:order-12 empty:hidden'>
          <BundleSelection mode={mode} />
        </div>
        <div className='max-md:order-14 empty:hidden'>
          <Options />
        </div>
        <StickyFormBar>
          <div className='flex gap-2'>
            {isEditMode && slug && <ViewButton slug={slug} />}
            {submitButton}
          </div>
        </StickyFormBar>
      </MainPanel>
    </FundraiserLayout>
  );
}
