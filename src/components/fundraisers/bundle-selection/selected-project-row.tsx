'use client';

import type { ProjectData } from '@/lib/types/project-selection';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Lock, Target, X } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/images';

interface SelectedProjectRowProps {
  project: ProjectData;
  percentage: number;
  isDefaultCause?: boolean;
  showLockIndicator?: boolean;
  onRemove: () => void;
}

function resolveImageSource(image?: string): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return getImageUrl('project', 'small', image);
}

export function SelectedProjectRow({
  project,
  percentage,
  isDefaultCause = false,
  showLockIndicator = false,
  onRemove,
}: SelectedProjectRowProps) {
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const tCustom = useTranslations('Fundraisers.form.bundleSelection.custom');
  const locale = useLocale();

  const countryDisplayNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: 'region' }),
    [locale]
  );

  function getCountryLabel(code: string): string {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return '';
    if (!/^[A-Z]{2}$/.test(normalized)) return normalized;
    return countryDisplayNames.of(normalized) ?? normalized;
  }

  const imageSource = resolveImageSource(project.image);
  const [imageFailed, setImageFailed] = useState(false);
  const countryLabel = project.country ? getCountryLabel(project.country) : '';

  const showTrailingIcon = !isDefaultCause || showLockIndicator;

  return (
    <li className='flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background p-3'>
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
        {countryLabel && (
          <p className='truncate text-xs text-muted-foreground'>
            {countryLabel}
          </p>
        )}
      </div>

      <span className='ml-2 shrink-0 text-sm font-semibold text-foreground tabular-nums'>
        {tCustom('allocationLabel', { percentage })}
      </span>

      {showTrailingIcon &&
        (isDefaultCause ? (
          <span
            className='flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground/60'
            aria-label={tCustom('aria.defaultProjectLocked', {
              name: project.name,
            })}
            title={tCustom('aria.defaultProjectLocked', {
              name: project.name,
            })}
          >
            <Lock className='h-3.5 w-3.5' aria-hidden='true' />
          </span>
        ) : (
          <button
            type='button'
            onClick={onRemove}
            aria-label={tCustom('aria.removeProject', { name: project.name })}
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </button>
        ))}
    </li>
  );
}
