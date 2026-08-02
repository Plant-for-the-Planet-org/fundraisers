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
 * Top of the main panel: Top Project badge, title, and a single metadata row
 * pairing the owner with the cost per unit.
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
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
          <ProjectOwner ownerName={ownerName} ownerAvatar={ownerAvatar} />
          <span
            aria-hidden='true'
            className='hidden h-4 w-px shrink-0 bg-neutral-400/60 sm:block'
          />
          <ProjectUnitCost
            unitCost={unitCost}
            unit={unit}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
