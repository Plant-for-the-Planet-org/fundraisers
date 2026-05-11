'use client';

import type { ProjectData } from '@/lib/types/project-selection';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Plus } from 'lucide-react';
import {
  buildProjectLearnMoreUrl,
  getDisplayableUnitCost,
} from '@/lib/utils/bundle';
import { resolveProjectImageSource } from '@/lib/utils/images';
import { useCountryLabel } from './use-country-label';

interface ProjectSearchCardProps {
  project: ProjectData;
  currencySymbol: string;
  onAdd: () => void;
}

export function ProjectSearchCard({
  project,
  currencySymbol,
  onAdd,
}: ProjectSearchCardProps) {
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const tCustom = useTranslations('Fundraisers.form.bundleSelection.custom');
  const getCountryLabel = useCountryLabel();

  const imageSource = resolveProjectImageSource(project.image);
  const [imageFailed, setImageFailed] = useState(false);
  const countryLabel = project.country ? getCountryLabel(project.country) : '';
  const unitDisplay = getDisplayableUnitCost(
    project.unitCost,
    project.unitType
  );

  return (
    <div className='flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background p-2'>
      <a
        href={buildProjectLearnMoreUrl(project.id)}
        target='_blank'
        rel='noopener noreferrer'
        aria-label={t('aria.openProject', { name: project.name })}
        className='group flex min-w-0 flex-1 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <div className='h-10 w-10 shrink-0 overflow-hidden rounded-md bg-linear-to-br from-emerald-200 via-purple-300 to-rose-300 dark:from-emerald-900 dark:via-purple-800 dark:to-rose-800'>
          {imageSource && !imageFailed && (
            <img
              src={imageSource}
              alt={t('projectImageAlt', { name: project.name })}
              className='h-full w-full object-cover'
              onError={() => setImageFailed(true)}
            />
          )}
        </div>

        <div className='min-w-0 flex-1 overflow-hidden'>
          <p className='flex items-center gap-1 truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary'>
            <span className='truncate'>{project.name}</span>
            <ExternalLink
              className='h-3 w-3 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100'
              aria-hidden='true'
            />
          </p>
          {(countryLabel || unitDisplay !== null) && (
            <p className='truncate text-xs text-muted-foreground'>
              {countryLabel}
              {countryLabel && unitDisplay !== null && ' · '}
              {unitDisplay !== null &&
                t('modal.unitCost', {
                  value: unitDisplay.value,
                  currencySymbol,
                  unitType: unitDisplay.unitType,
                })}
            </p>
          )}
        </div>
      </a>

      <button
        type='button'
        onClick={onAdd}
        aria-label={tCustom('aria.addProject', { name: project.name })}
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <Plus className='h-4 w-4' aria-hidden='true' />
      </button>
    </div>
  );
}
