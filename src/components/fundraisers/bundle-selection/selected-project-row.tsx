'use client';

import type { ProjectData } from '@/lib/types/project-selection';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info, Target, X } from 'lucide-react';
import { buildProjectUrl } from '@/lib/utils/bundle';
import { resolveProjectImageSource } from '@/lib/utils/images';
import { useCountryLabel } from './use-country-label';

interface SelectedProjectRowProps {
  project: ProjectData;
  percentage: number;
  isDefaultCause?: boolean;
  readOnly?: boolean;
  notAcceptingDonations?: boolean;
  onRemove: () => void;
}

export function SelectedProjectRow({
  project,
  percentage,
  isDefaultCause = false,
  readOnly = false,
  notAcceptingDonations = false,
  onRemove,
}: SelectedProjectRowProps) {
  const t = useTranslations('Bundles');
  const tCustom = useTranslations('Bundles.custom');
  const getCountryLabel = useCountryLabel();

  const imageSource = resolveProjectImageSource(project.image);
  const [imageFailed, setImageFailed] = useState(false);
  const countryLabel = project.country ? getCountryLabel(project.country) : '';

  // Non-donatable projects show a badge instead of a percentage. Hide the
  // meta line when no country is available.
  const metaLine = [
    isDefaultCause ? tCustom('globalLabel') : countryLabel,
    notAcceptingDonations ? null : tCustom('allocationLabel', { percentage }),
  ]
    .filter(Boolean)
    .join(' · ');

  const showTrailingIcon = !isDefaultCause && !readOnly;

  return (
    <li className='flex min-w-0 items-start gap-3 rounded-lg border border-border bg-background p-3'>
      <div className='h-10 w-10 shrink-0 overflow-hidden rounded-md bg-linear-to-br from-emerald-200 via-purple-300 to-rose-300 dark:from-emerald-900 dark:via-purple-800 dark:to-rose-800'>
        {imageSource && !imageFailed ? (
          <img
            src={imageSource}
            alt={t('projectImageAlt', { name: project.name })}
            className='h-full w-full object-cover'
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <Target
              className='h-4 w-4 text-muted-foreground'
              aria-hidden='true'
            />
          </div>
        )}
      </div>

      <div className='min-w-0 flex-1 overflow-hidden'>
        <p className='line-clamp-2 text-sm font-semibold text-foreground'>
          {project.name}
        </p>
        {metaLine && (
          <p className='truncate text-xs text-muted-foreground'>{metaLine}</p>
        )}
        {notAcceptingDonations && (
          <span className='mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
            <Info className='h-3 w-3 shrink-0' aria-hidden='true' />
            {t('notAcceptingDonations')}
          </span>
        )}
        {isDefaultCause ? (
          <>
            <p className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>
              {tCustom('defaultCauseTooltip')}
            </p>
            <a
              href='https://www.plant-for-the-planet.org/youth-empowerment/'
              target='_blank'
              rel='noopener noreferrer'
              className='mt-1 inline-block text-xs text-primary underline-offset-2 hover:underline'
              onClick={e => e.stopPropagation()}
            >
              {tCustom('viewTransparency')}
            </a>
          </>
        ) : project.description ? (
          <p className='mt-0.5 line-clamp-3 text-xs text-muted-foreground'>
            {project.description}
          </p>
        ) : null}
        {(project.purpose === 'trees' ||
          project.purpose === 'conservation') && (
          <a
            href={buildProjectUrl(project.id)}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-1 inline-block text-xs text-primary underline-offset-2 hover:underline'
            onClick={e => e.stopPropagation()}
          >
            {tCustom('viewTransparency')}
          </a>
        )}
      </div>

      {showTrailingIcon && (
        <button
          type='button'
          onClick={onRemove}
          aria-label={tCustom('aria.removeProject', { name: project.name })}
          className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      )}
    </li>
  );
}
