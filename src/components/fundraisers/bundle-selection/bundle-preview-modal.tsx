'use client';

import type { Bundle, BundleTabId, BundleWorkspace } from '@/lib/types/bundle';
import type { GetProject } from '@/lib/types/project-selection';

import { useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import {
  getBundleProjectIds,
  getDonatableBundleProjectIds,
  getSupportProjectId,
} from '@/lib/utils/bundle';
import { calculateProjectAllocations } from '@/lib/utils/project-allocation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
   * True for the bundle persisted when the fundraiser was saved. Non-donatable
   * projects remain visible; other bundles filter them out.
   */
  isPersisted: boolean;
}

export function BundlePreviewModal({
  bundle,
  bundleWorkspace,
  activeTab,
  isOpen,
  getProject,
  onClose,
  onUseBundle,
  isPersisted,
}: BundlePreviewModalProps) {
  const t = useTranslations('Bundles');
  const label = t(`entries.${bundle.slug}.label`);
  const tagline = t(`entries.${bundle.slug}.tagline`);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // The persisted bundle shows its saved projects (donatable and non-donatable
  // alike), but never the unresolvable "unknown" placeholders for bundle-config
  // IDs missing from the fundraiser's allocations. Other bundles filter out all
  // non-donatable projects. Either way, anything dropped from the full bundle is
  // surfaced via `removedCount` so the modal explains why fewer than 5 render.
  const { projectIds, removedCount } = useMemo(() => {
    const allIds = getBundleProjectIds(bundle, bundleWorkspace);
    const visibleIds = isPersisted
      ? allIds.filter(id => !getProject(id).isUnknown)
      : getDonatableBundleProjectIds(bundle, bundleWorkspace, getProject);
    return {
      projectIds: visibleIds,
      removedCount: allIds.length - visibleIds.length,
    };
  }, [isPersisted, bundle, bundleWorkspace, getProject]);
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={event => {
          // Avoid focusing the "Use Bundle" CTA on open (Enter would trigger it).
          // Focus the close button instead — non-destructive default.
          event.preventDefault();
          closeButtonRef.current?.focus();
        }}
        className='w-full sm:max-w-4xl gap-0 overflow-hidden rounded-2xl p-0'
      >
        <DialogTitle className='sr-only'>{label}</DialogTitle>
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
            ref={closeButtonRef}
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
      </DialogContent>
    </Dialog>
  );
}
