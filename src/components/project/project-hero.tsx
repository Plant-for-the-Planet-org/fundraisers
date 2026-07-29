import type { ProjectPaymentOptions } from '@/lib/types/payment-options';

import TitleDisplay from '@/components/fundraisers/title-display';
import { ProjectOwner } from './project-owner';
import { ProjectUnitCost } from './project-unit-cost';
import { TopProjectBadge } from './top-project-badge';

interface ProjectHeroProps {
  project: Pick<
    ProjectPaymentOptions,
    | 'name'
    | 'ownerName'
    | 'ownerAvatar'
    | 'isTopProject'
    | 'unitCost'
    | 'unit'
    | 'currency'
  >;
}

/**
 * Top of the main panel: Top Project badge, title, owner, and cost per unit.
 */
export function ProjectHero({ project }: ProjectHeroProps) {
  const {
    name,
    ownerName,
    ownerAvatar,
    isTopProject,
    unitCost,
    unit,
    currency,
  } = project;

  return (
    <div className='flex flex-col gap-4'>
      {isTopProject && <TopProjectBadge />}
      <div className='flex flex-col gap-3'>
        <TitleDisplay value={name} />
        <ProjectOwner ownerName={ownerName} ownerAvatar={ownerAvatar} />
      </div>
      {/* Half width from md up, leaving room for the second stat the design
          pairs it with (goal progress, out of scope here). */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <ProjectUnitCost unitCost={unitCost} unit={unit} currency={currency} />
      </div>
    </div>
  );
}
