'use client';

import type { SelectedProject } from '@/lib/types/project-selection';
import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Target } from 'lucide-react';
import { MIN_DEFAULT_CAUSE_PERCENT } from '@/lib/constants/project-selection';
import { getImageUrl } from '@/lib/utils/images';
import {
  calculateProjectAllocations,
  createDefaultCause,
} from '@/lib/utils/project-selection';
import { Button } from '@/components/ui/button';
import { ProjectSelectionOverlay } from './project-selection-overlay';
import { SectionHeader } from './typography';

function getProjectImageSource(image?: string): string | null {
  if (!image) {
    return null;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return getImageUrl('project', 'small', image);
}

interface ProjectSelectionProps {
  initialExtraProjects?: SelectedProject[];
}

export function ProjectSelection({
  initialExtraProjects,
}: ProjectSelectionProps = {}) {
  const t = useTranslations('Fundraisers.form.projectSelection');
  const { control, setValue } = useFormContext<CreateFundraiserFormValues>();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const country = useWatch<CreateFundraiserFormValues, 'country'>({
    control,
    name: 'country',
  });

  const [extraProjects, setExtraProjects] = useState<SelectedProject[]>(
    () => initialExtraProjects ?? []
  );

  const lastAllocationsSnapshotRef = useRef<string | null>(null);

  const defaultCause = useMemo(
    () =>
      createDefaultCause(country ?? 'DE', [], {
        name: t('defaultCause.name'),
        description: t('defaultCause.description'),
      }),
    [country, t]
  );

  const selectedProjects = useMemo(
    () => [defaultCause, ...extraProjects],
    [defaultCause, extraProjects]
  );

  const defaultCauseId = defaultCause.id;
  const projectAllocations = useMemo(
    () =>
      calculateProjectAllocations(
        selectedProjects,
        defaultCauseId,
        MIN_DEFAULT_CAUSE_PERCENT
      ),
    [selectedProjects, defaultCauseId]
  );

  useEffect(() => {
    const nextAllocations = projectAllocations.map(project => ({
      project_id: project.id,
      percentage: project.percentage,
    }));
    const snapshot = nextAllocations
      .map(allocation => `${allocation.project_id}:${allocation.percentage}`)
      .join('|');

    // Skip the first run so mounting never dirties the form (survives Strict Mode double-invoke).
    if (lastAllocationsSnapshotRef.current === null) {
      lastAllocationsSnapshotRef.current = snapshot;
      return;
    }

    if (lastAllocationsSnapshotRef.current === snapshot) {
      return;
    }

    lastAllocationsSnapshotRef.current = snapshot;

    setValue('projectAllocations', nextAllocations, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [projectAllocations, setValue]);

  function handleSelectProject(project: SelectedProject) {
    if (project.id === defaultCauseId) {
      return;
    }

    if (
      selectedProjects.some(
        selectedProject => selectedProject.id === project.id
      )
    ) {
      return;
    }

    setExtraProjects(prev => [
      ...prev,
      {
        ...project,
        isDefault: false,
      },
    ]);
  }

  function handleRemoveProject(projectId: string) {
    if (projectId === defaultCauseId) {
      return;
    }

    setExtraProjects(prev => prev.filter(project => project.id !== projectId));
  }

  return (
    <>
      <div className='flex flex-col gap-3'>
        <SectionHeader
          className='flex-row items-center justify-between'
          actionSlot={
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsOverlayOpen(true)}
              className='h-auto p-0 text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight hover:opacity-70 transition-opacity'
            >
              {t('addCause')}
            </Button>
          }
        >
          {t('sectionHeading')}
        </SectionHeader>

        <div className='space-y-4'>
          {projectAllocations.map((project, index) => {
            const projectImageSource = getProjectImageSource(project.image);
            const isLastProject = index === projectAllocations.length - 1;

            return (
              <div key={project.id}>
                <div className='flex gap-4'>
                  <div className='w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                    {projectImageSource ? (
                      <img
                        src={projectImageSource}
                        alt={t('projectImageAlt', { name: project.name })}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Target className='w-6 h-6 text-gray-400' />
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <p className='text-zinc-800 dark:text-gray-100 text-base font-semibold leading-tight'>
                      {project.name}
                    </p>
                    <p className='text-zinc-800 dark:text-gray-100 text-base font-normal leading-tight mt-1 line-clamp-3'>
                      {project.description}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='text-sm text-green-600 font-medium'>
                        {t('allocationLabel', {
                          percentage: project.percentage,
                        })}
                      </span>

                      {!project.isDefault && (
                        <>
                          <span className='text-sm text-gray-300'>•</span>
                          <button
                            type='button'
                            onClick={() => handleRemoveProject(project.id)}
                            className='text-sm text-red-500 hover:text-red-700 font-medium'
                          >
                            {t('removeCause')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!isLastProject && (
                  <div className='mt-3 h-px bg-gray-200 dark:bg-gray-700' />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ProjectSelectionOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        onSelectProject={handleSelectProject}
        selectedProjectIds={selectedProjects.map(project => project.id)}
      />
    </>
  );
}
