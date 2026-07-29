import type { ProjectPaymentOptions } from '@/lib/types/payment-options';

import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';

interface ProjectViewProps {
  paymentOptions: ProjectPaymentOptions;
}

/**
 * Two-panel shell for the project page. Reuses the same layout primitives as
 * `FundraiserView` so both pages stay visually aligned.
 *
 * `paymentOptions` is not read yet — Steps 3 to 5 feed it into the sections
 * below.
 */
export function ProjectView({
  paymentOptions: _paymentOptions,
}: ProjectViewProps) {
  return (
    <FundraiserLayout>
      <SidebarPanel>
        <>{/* Step 3: hero image */}</>
      </SidebarPanel>
      <MainPanel>
        <>
          {/* Step 3: badge, title, owner, cost per unit */}
          {/* Step 5: contribution */}
          {/* Step 4: about */}
        </>
      </MainPanel>
    </FundraiserLayout>
  );
}
