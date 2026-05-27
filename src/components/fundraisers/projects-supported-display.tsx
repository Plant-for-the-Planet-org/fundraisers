'use client';

import type { ProjectAllocation } from '@/lib/types/fundraiser';
import type { ProjectData } from '@/lib/types/project-selection';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getBundleBySlug } from '@/lib/utils/bundle';
import { toAllowedCountry } from '@/lib/utils/country-currency';
import { getImageUrl } from '@/lib/utils/images';
import { useBundleProjects } from '@/components/fundraisers/bundle-selection/use-bundle-projects';
import { useCountryLabel } from '@/components/fundraisers/bundle-selection/use-country-label';
import { SectionHeader } from '@/components/fundraisers/typography';

const DESCRIPTION_TRUNCATION_THRESHOLD = 180;

interface ProjectItemProps {
  project: ProjectAllocation['project'];
  enrichedProject: ProjectData;
  getCountryLabel: (code: string) => string;
}

function ProjectItem({
  project,
  enrichedProject,
  getCountryLabel,
}: ProjectItemProps) {
  const t = useTranslations('Fundraisers.form.projectSelection');
  const [isExpanded, setIsExpanded] = useState(false);

  const imageSource = getImageUrl('project', 'small', project.image);
  const description = project.description ?? '';
  const needsTruncation = description.length > DESCRIPTION_TRUNCATION_THRESHOLD;
  const descriptionId = `project-description-${project.id}`;

  const countryLabel = enrichedProject.country
    ? getCountryLabel(enrichedProject.country)
    : '';

  return (
    <li className='project-item flex gap-4'>
      {imageSource !== null && (
        <div className='w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'>
          <img
            src={imageSource}
            alt={t('projectImageAlt', { name: project.name })}
            className='w-full h-full object-cover'
            loading='lazy'
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
        <h3 className='text-foreground text-base font-semibold leading-tight'>
          {project.name}
        </h3>
        {countryLabel && (
          <p className='text-sm text-foreground'>{countryLabel}</p>
        )}
        {description && (
          <div className='flex flex-col gap-1 items-start'>
            <p
              id={descriptionId}
              className={cn(
                'text-foreground text-base font-normal leading-tight',
                { 'line-clamp-3': !isExpanded && needsTruncation }
              )}
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

interface BundleHeaderProps {
  label: string;
  tagline: string;
}

function BundleHeader({ label, tagline }: BundleHeaderProps) {
  return (
    <p className='mb-2 text-sm leading-snug'>
      <span className='font-semibold text-foreground'>{label}</span>
      <span className='text-muted-foreground'> — </span>
      <span className='italic text-muted-foreground'>
        &ldquo;{tagline}&rdquo;
      </span>
    </p>
  );
}

interface ProjectsSupportedDisplayProps {
  projectAllocations: ProjectAllocation[];
  workspaceCountry: string | null | undefined;
  bundleSlug: string | null;
}

export function ProjectsSupportedDisplay({
  projectAllocations,
  workspaceCountry,
  bundleSlug,
}: ProjectsSupportedDisplayProps) {
  const t = useTranslations('Fundraisers.form.projectSelection');
  const tBundles = useTranslations('Bundles');

  const { getProject } = useBundleProjects(toAllowedCountry(workspaceCountry));
  const getCountryLabel = useCountryLabel();
  const bundle = getBundleBySlug(bundleSlug);

  if (!projectAllocations?.length) return null;

  return (
    <div className='project-supported-display flex flex-col gap-3'>
      <SectionHeader
        actionSlot={
          bundle && (
            <BundleHeader
              label={tBundles(`entries.${bundle.slug}.label`)}
              tagline={tBundles(`entries.${bundle.slug}.tagline`)}
            />
          )
        }
      >
        {t('viewModeSectionHeading')}
      </SectionHeader>
      <ul className='space-y-4'>
        {projectAllocations.map(({ project }) => (
          <ProjectItem
            key={project.id}
            project={project}
            enrichedProject={getProject(project.id)}
            getCountryLabel={getCountryLabel}
          />
        ))}
      </ul>
    </div>
  );
}
