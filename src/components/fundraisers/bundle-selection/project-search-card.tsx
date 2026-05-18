'use client';

import type { ProjectData } from '@/lib/types/project-selection';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { getDisplayableUnitCost } from '@/lib/utils/bundle';
import { resolveProjectImageSource } from '@/lib/utils/images';
import { useCountryLabel } from './use-country-label';

interface ProjectSearchCardProps {
  project: ProjectData;
  onAdd: () => void;
  disabled?: boolean;
}

export function ProjectSearchCard({
  project,
  onAdd,
  disabled,
}: ProjectSearchCardProps) {
  const t = useTranslations('Bundles');
  const tCustom = useTranslations('Bundles.custom');
  const getCountryLabel = useCountryLabel();

  const imageSource = resolveProjectImageSource(project.image);
  const [imageFailed, setImageFailed] = useState(false);
  const countryLabel = project.country ? getCountryLabel(project.country) : '';
  const unitDisplay = getDisplayableUnitCost(
    project.unitCost,
    project.unitType
  );

  return (
    <div className='flex min-w-0 cursor-default items-start gap-2 rounded-xl border border-border bg-background p-2 hover:border-primary'>
      <div className='flex min-w-0 flex-1 items-start gap-2'>
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

        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-foreground'>
            {project.isTopProject ? `${project.name} ✨` : project.name}
          </p>
          {countryLabel && (
            <p className='text-xs text-muted-foreground'>{countryLabel}</p>
          )}
        </div>
      </div>

      <button
        type='button'
        onClick={onAdd}
        disabled={disabled}
        aria-label={tCustom('aria.addProject', { name: project.name })}
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground'
      >
        <Plus className='h-4 w-4' aria-hidden='true' />
      </button>
    </div>
  );
}
