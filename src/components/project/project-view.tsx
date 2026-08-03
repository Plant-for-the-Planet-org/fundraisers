import type { ProjectPaymentOptions } from '@/lib/types/payment-options';

import { SecurityNotice } from '@/components/fundraisers/security-notice';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { ProjectAbout } from './project-about';
import { ProjectContribution } from './project-contribution';
import { ProjectHero } from './project-hero';
import { ProjectImage } from './project-image';

interface ProjectViewProps {
  paymentOptions: ProjectPaymentOptions;
}

/**
 * Two-panel shell for the project page. Reuses the same layout primitives as
 * `FundraiserView` so both pages stay visually aligned.
 */
export function ProjectView({ paymentOptions }: ProjectViewProps) {
  return (
    <FundraiserLayout>
      <SidebarPanel>
        <ProjectImage image={paymentOptions.image} name={paymentOptions.name} />
        {/* TODO: Replace placeholder values with real organization and tax-deductibility data from the endpoint. */}
        <SecurityNotice
          organizationName='Plant-for-the-Planet'
          countryCode='DE'
          isTaxDeductible={true}
        />
      </SidebarPanel>
      <MainPanel>
        <ProjectHero project={paymentOptions} />
        <ProjectContribution paymentOptions={paymentOptions} />
        <ProjectAbout description={paymentOptions.description} />
      </MainPanel>
    </FundraiserLayout>
  );
}
