'use client';

import type { ProjectAllocation } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/fundraisers/typography';
import { getImageUrl } from '@/lib/utils/images';

const DESCRIPTION_TRUNCATION_THRESHOLD = 180;

interface ProjectItemProps {
  project: ProjectAllocation['project'];
}

function ProjectItem({ project }: ProjectItemProps) {
  const t = useTranslations('Fundraisers.create.projectSelection');
  const [isExpanded, setIsExpanded] = useState(false);

  const imageSource = getImageUrl('project', 'small', project.image);
  const description = project.description ?? '';
  const needsTruncation = description.length > DESCRIPTION_TRUNCATION_THRESHOLD;
  const descriptionId = `project-description-${project.id}`;

  return (
    <li className='project-item flex gap-4'>
      {imageSource && (
        <div className='w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'>
          <img
            src={imageSource}
            alt={t('projectImageAlt', { name: project.name })}
            className='w-full h-full object-cover'
            loading='lazy'
          />
        </div>
      )}

      <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
        <h3 className='text-foreground text-base font-semibold leading-tight'>
          {project.name}
        </h3>
        {description && (
          <div className='flex flex-col gap-1 items-start'>
            <p
              id={descriptionId}
              className={`text-foreground text-base font-normal leading-tight${!isExpanded && needsTruncation ? ' line-clamp-3' : ''}`}
            >
              {description}
            </p>
            {needsTruncation && (
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                aria-controls={descriptionId}
                className='text-sm font-medium text-primary hover:text-primary/80 transition-colors'
              >
                {isExpanded ? t('collapseDescription') : t('expandDescription')}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

interface ProjectsSupportedDisplayProps {
  projectAllocations: ProjectAllocation[];
}

export function ProjectsSupportedDisplay({
  projectAllocations,
}: ProjectsSupportedDisplayProps) {
  const t = useTranslations('Fundraisers.create.projectSelection');

  if (!projectAllocations?.length) return null;

  return (
    <div className='project-supported-display flex flex-col gap-3'>
      <SectionHeader>{t('viewModeSectionHeading')}</SectionHeader>
      <ul className='space-y-4'>
        {projectAllocations.map(({ project }) => (
          <ProjectItem key={project.id} project={project} />
        ))}
      </ul>
    </div>
  );
}
