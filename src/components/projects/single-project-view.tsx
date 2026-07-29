import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';

interface SingleProjectViewProps {
  /** Project slug from the `projectSlug` query parameter. */
  projectSlug: string;
}

/**
 * Two-panel shell for the single project page. Reuses the same layout
 * primitives as `FundraiserView` so both pages stay visually aligned.
 *
 * `projectSlug` is not read yet — Step 2 uses it to load the project's payment
 * options and pass the data into the sections below.
 */
export function SingleProjectView({
  projectSlug: _projectSlug,
}: SingleProjectViewProps) {
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
