'use client';

import type { Bundle, BundleTabId, BundleWorkspace } from '@/lib/types/bundle';
import type { GetProject } from '@/lib/types/project-selection';

import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useModalDialog } from '@/lib/hooks/use-modal-dialog';
import {
  getBundleProjectIds,
  getDonatableBundleProjectIds,
  getSupportProjectId,
} from '@/lib/utils/bundle';
import { calculateProjectAllocations } from '@/lib/utils/project-allocation';
import { Button } from '@/components/ui/button';
import { SelectedProjectRow } from './selected-project-row';

interface BundlePreviewModalProps {
  bundle: Bundle;
  bundleWorkspace: BundleWorkspace;
  activeTab: Exclude<BundleTabId, 'custom'>;
  isOpen: boolean;
  getProject: GetProject;
  onClose: () => void;
  onUseBundle: (bundle: Bundle) => void;
  /**
   * True for the initially selected bundle. Non-donatable projects remain visible;
   * other bundles filter them out.
   */
  isPreSelected: boolean;
}

export function BundlePreviewModal({
  bundle,
  bundleWorkspace,
  activeTab,
  isOpen,
  getProject,
  onClose,
  onUseBundle,
  isPreSelected,
}: BundlePreviewModalProps) {
  const t = useTranslations('Bundles');
  const label = t(`entries.${bundle.slug}.label`);
  const tagline = t(`entries.${bundle.slug}.tagline`);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalDialog({ isOpen, onClose, dialogRef });

  // The initial bundle shows all projects. Other bundles filter out
  // non-donatable projects and display how many were removed.
  const { projectIds, removedCount } = useMemo(() => {
    const allIds = getBundleProjectIds(bundle, bundleWorkspace);
    if (isPreSelected) {
      return { projectIds: allIds, removedCount: 0 };
    }
    const donatableIds = getDonatableBundleProjectIds(
      bundle,
      bundleWorkspace,
      getProject
    );
    return {
      projectIds: donatableIds,
      removedCount: allIds.length - donatableIds.length,
    };
  }, [isPreSelected, bundle, bundleWorkspace, getProject]);
  const supportProjectId = getSupportProjectId(bundleWorkspace);
  // Only donatable projects are used for allocation, so percentages remain unchanged.
  const percentageById = useMemo(() => {
    const donatableProjects = projectIds
      .map(id => getProject(id))
      .filter(project => project.allowDonations);
    const allocations = calculateProjectAllocations(
      donatableProjects,
      supportProjectId
    );
    return Object.fromEntries(allocations.map(a => [a.id, a.percentage]));
  }, [projectIds, supportProjectId, getProject]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className='fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-black/30 px-3 py-3 backdrop-blur-sm outline-none sm:px-4 sm:py-6'
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role='dialog'
      aria-modal='true'
      aria-label={label}
    >
      <div className='mx-auto flex w-full max-w-[56rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl'>
        <div className='flex shrink-0 flex-wrap items-center gap-2 bg-orange-100 px-4 py-4 dark:bg-orange-950/30'>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <h2 className='wrap-break-word text-base font-semibold text-foreground sm:text-lg'>
                {label}
              </h2>
              <span className='rounded-md bg-orange-200 px-2 py-0.5 text-xs font-bold tracking-wide text-orange-900 dark:bg-orange-800/60 dark:text-orange-100'>
                {t(`modal.tag.${activeTab}`)}
              </span>
            </div>
            <p className='mt-1 text-sm italic text-muted-foreground'>
              &ldquo;{tagline}&rdquo;
            </p>
          </div>

          <Button
            onClick={() => onUseBundle(bundle)}
            className='order-last w-full bg-zinc-900 text-white hover:bg-zinc-800 sm:order-0 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
          >
            {t('modal.useBundle')}
          </Button>

          <button
            type='button'
            onClick={onClose}
            aria-label={t('aria.closeModal')}
            className='flex h-9 min-w-9 shrink-0 items-center justify-center self-start rounded-md bg-background text-muted-foreground transition-colors hover:bg-background/80 sm:self-auto'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='px-4 py-4'>
          <p className='mb-3 text-xs font-bold tracking-wide text-muted-foreground'>
            {t('modal.projectsInside', { count: projectIds.length })}
          </p>

          {removedCount > 0 && (
            <p className='mb-3 text-xs text-amber-600 dark:text-amber-400'>
              {t('modal.projectsRemoved', { count: removedCount })}
            </p>
          )}

          <ul className='columns-1 gap-2 min-[600px]:columns-2 [&>*]:mb-2 [&>*]:break-inside-avoid'>
            {projectIds.map(id => {
              const percentage = percentageById[id];
              return (
                <SelectedProjectRow
                  key={id}
                  project={getProject(id)}
                  percentage={percentage ?? 0}
                  notAcceptingDonations={percentage === undefined}
                  isDefaultCause={id === supportProjectId}
                  readOnly={true}
                  onRemove={() => {}}
                />
              );
            })}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
