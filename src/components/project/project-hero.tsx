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
 * Top of the main panel: Top Project badge, title, and the owner with the
 * cost per unit stacked directly beneath it.
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
        <div className='flex flex-col gap-2'>
          <ProjectOwner ownerName={ownerName} ownerAvatar={ownerAvatar} />
          <ProjectUnitCost
            unitCost={unitCost}
            unit={unit}
            currency={currency}
            className='pl-8.5'
          />
        </div>
      </div>
    </div>
  );
}
