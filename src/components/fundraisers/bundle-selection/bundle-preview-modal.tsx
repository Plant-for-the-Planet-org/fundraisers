'use client';

import type { Bundle, BundleWorkspace } from '@/lib/types/bundle';
import type { ProjectData } from '@/lib/types/project-selection';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Package, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildProjectLearnMoreUrl,
  getBundleProjectIds,
  getDisplayableUnitCost,
  getDisplayTabForBundle,
  getSupportProjectId,
} from '@/lib/utils/bundle';
import { resolveProjectImageSource } from '@/lib/utils/images';
import { Button } from '@/components/ui/button';
import { useCountryLabel } from './use-country-label';

interface BundlePreviewModalProps {
  bundle: Bundle;
  workspace: BundleWorkspace;
  isOpen: boolean;
  getProject: (id: string) => ProjectData;
  onClose: () => void;
  onUseBundle: (bundle: Bundle) => void;
}

const TAB_KEY_BY_ID = {
  'staff-picks': 'staffPicks',
  wonder: 'wonder',
  rage: 'rage',
  love: 'love',
} as const;

export function BundlePreviewModal({
  bundle,
  workspace,
  isOpen,
  getProject,
  onClose,
  onUseBundle,
}: BundlePreviewModalProps) {
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const getCountryLabel = useCountryLabel();

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const projectIds = useMemo(
    () => getBundleProjectIds(bundle, workspace),
    [bundle, workspace]
  );
  const supportId = getSupportProjectId(workspace);

  if (!isOpen || typeof document === 'undefined') return null;

  const tabKey = TAB_KEY_BY_ID[getDisplayTabForBundle(bundle)];

  return createPortal(
    <div
      className='fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-black/30 px-3 pt-[6vh] pb-3 backdrop-blur-sm sm:px-4 sm:pt-[8vh] sm:pb-4'
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role='dialog'
      aria-modal='true'
      aria-label={bundle.label}
    >
      <div className='mx-auto w-full max-w-[min(56rem,100dvw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl'>
        <div className='flex items-start gap-2 bg-orange-100 px-4 py-4 dark:bg-orange-950/30'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm sm:h-12 sm:w-12'>
            <Package
              className='h-5 w-5 text-foreground sm:h-6 sm:w-6'
              aria-hidden='true'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <h2 className='wrap-break-word text-base font-semibold text-foreground sm:text-lg'>
                {bundle.label}
              </h2>
              <span className='rounded-md bg-orange-200 px-2 py-0.5 text-xs font-bold tracking-wide text-orange-900 dark:bg-orange-800/60 dark:text-orange-100'>
                {t(`modal.tag.${tabKey}` as const)}
              </span>
            </div>
            <p className='mt-1 text-sm italic text-muted-foreground'>
              &ldquo;{bundle.tagline}&rdquo;
            </p>
          </div>

          <Button
            onClick={() => onUseBundle(bundle)}
            className='bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
          >
            {t('modal.useBundle')}
          </Button>

          <button
            type='button'
            onClick={onClose}
            aria-label={t('aria.closeModal')}
            className='flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground transition-colors hover:bg-background/80'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='max-h-[60vh] overflow-y-auto px-4 py-4'>
          <p className='mb-3 text-xs font-bold tracking-wide text-muted-foreground'>
            {t('modal.projectsInside', { count: projectIds.length })}
          </p>

          <p className='mb-3 text-xs text-muted-foreground'>
            {t('modal.clickProjectHint')}
          </p>

          <ul className='flex flex-col gap-2'>
            {projectIds.map(id => {
              const project = getProject(id);
              const imageSource = resolveProjectImageSource(project.image);
              const isSupportProject = id === supportId;
              const countryLabel = project.country
                ? getCountryLabel(project.country)
                : '';
              const unit = getDisplayableUnitCost(
                project.unitCost,
                project.unitType
              );

              const content = (
                <>
                  {' '}
                  <div className='h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted sm:h-12 sm:w-12'>
                    {imageSource ? (
                      <img
                        src={imageSource}
                        alt={t('projectImageAlt', { name: project.name })}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center'>
                        <Target
                          className='h-5 w-5 text-muted-foreground'
                          aria-hidden='true'
                        />
                      </div>
                    )}
                  </div>
                  <div className='min-w-0 flex-1 overflow-hidden'>
                    <p className='line-clamp-2 wrap-break-word font-medium text-foreground sm:truncate'>
                      {project.name}
                    </p>
                    {(countryLabel || unit !== null) && (
                      <p className='truncate text-sm text-muted-foreground'>
                        {countryLabel}
                      </p>
                    )}
                  </div>
                </>
              );

              const baseClassName =
                'flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5 border border-border';

              return (
                <li key={id}>
                  {isSupportProject ? (
                    <div className={cn(baseClassName)}>{content}</div>
                  ) : (
                    <a
                      href={buildProjectLearnMoreUrl(id)}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={t('aria.openProject', {
                        name: project.name,
                      })}
                      className={cn(
                        baseClassName,
                        'cursor-pointer transition-colors hover:bg-orange-50 dark:border-orange-800/60 dark:hover:bg-orange-950/20'
                      )}
                    >
                      {content}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
