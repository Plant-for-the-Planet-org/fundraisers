import { ProjectSelection } from '@/components/fundraisers/project-selection';
import { ContributionSettings } from '@/components/fundraisers/contribution-settings';
import { CreateFundraiserButton } from '@/components/fundraisers/create-fundraiser-button';
import { WorkspaceInfo } from '@/components/fundraisers/workspace-info';
import { ThemeSettings } from '@/components/fundraisers/theme-settings';
import { Description } from '@/components/fundraisers/description';
import { DonorsPreview } from '@/components/fundraisers/donors-preview';
import { GoalPreview } from '@/components/fundraisers/goal-preview';
import { GoalInput } from '@/components/fundraisers/goal-input';
import { HostPreview } from '@/components/fundraisers/host-preview';
import { ImageSelector } from '@/components/fundraisers/image-selector';
import { Options } from '@/components/fundraisers/options';
import { Title } from '@/components/fundraisers/title';
import { WorkspaceSelector } from '@/components/fundraisers/workspace-selector';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';

export default function CreateFundraiserPage() {
  return (
    <>
      <FundraiserLayout>
        <SidebarPanel>
          <ImageSelector />
          <GoalPreview />
          <DonorsPreview />
          <HostPreview />
          <ThemeSettings />
        </SidebarPanel>
        <MainPanel>
          <Title />
          <ContributionSettings />
          <Description />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <WorkspaceSelector />
            <GoalInput />
          </div>
          <WorkspaceInfo />
          <ProjectSelection />
          <Options />
          <CreateFundraiserButton />
        </MainPanel>
      </FundraiserLayout>
    </>
  );
}
