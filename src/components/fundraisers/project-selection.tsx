'use client';

import type { SelectedProject } from '@/lib/types/project-selection';
import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

type ProjectAllocations = FundraiserFormValues['projectAllocations'];
type ProjectDetailsById = Record<string, SelectedProject>;

function getProjectImageSource(image?: string): string | null {
  if (!image) {
    return null;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return getImageUrl('project', 'small', image);
}

function recalculateAllocations(
  projectIds: string[],
  defaultCauseId: string
): ProjectAllocations {
  const shell: SelectedProject[] = projectIds.map(id => ({
    id,
    name: '',
    description: '',
  }));
  return calculateProjectAllocations(
    shell,
    defaultCauseId,
    MIN_DEFAULT_CAUSE_PERCENT
  ).map(project => ({
    project_id: project.id,
    percentage: project.percentage,
  }));
}

interface ProjectSelectionProps {
  nonDefaultInitialProjects?: SelectedProject[];
}

export function ProjectSelection({
  nonDefaultInitialProjects,
}: ProjectSelectionProps = {}) {
  const t = useTranslations('Fundraisers.form.projectSelection');
  const { control, setValue } = useFormContext<FundraiserFormValues>();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const country = useWatch<FundraiserFormValues, 'country'>({
    control,
    name: 'country',
  });
  const projectAllocations = useWatch<
    FundraiserFormValues,
    'projectAllocations'
  >({
    control,
    name: 'projectAllocations',
  });
  const allocations = useMemo(
    () => projectAllocations ?? [],
    [projectAllocations]
  );

  // Presentation-only cache of project metadata (name/description/image).
  // Form state only stores { project_id, percentage }; this fills in the rest for rendering.
  // Not a parallel source of truth: it is never written back to the form.
  const [sessionProjectDetails, setSessionProjectDetails] =
    useState<ProjectDetailsById>({});

  const projectDetailsById = useMemo<ProjectDetailsById>(() => {
    const fromInitial: ProjectDetailsById = {};
    for (const project of nonDefaultInitialProjects ?? []) {
      fromInitial[project.id] = project;
    }
    // Session-added details win over initial ones when ids collide.
    return { ...fromInitial, ...sessionProjectDetails };
  }, [nonDefaultInitialProjects, sessionProjectDetails]);

  const defaultWorkspaceCause = useMemo(
    () =>
      createDefaultCause(country ?? 'DE', [], {
        name: t('defaultCause.name'),
        description: t('defaultCause.description'),
      }),
    [country, t]
  );
  const defaultWorkspaceCauseId = defaultWorkspaceCause.id;

  const displayedAllocations = useMemo(
    () =>
      allocations.map(({ project_id, percentage }) => {
        const isDefault = project_id === defaultWorkspaceCauseId;
        const details = isDefault
          ? defaultWorkspaceCause
          : projectDetailsById[project_id];
        return {
          id: project_id,
          name: details?.name ?? '',
          description: details?.description ?? '',
          image: details?.image,
          country: details?.country,
          percentage,
          isDefault,
        };
      }),
    [
      allocations,
      defaultWorkspaceCauseId,
      defaultWorkspaceCause,
      projectDetailsById,
    ]
  );

  const selectedProjectIds = useMemo(
    () =>
      Array.from(
        new Set([
          defaultWorkspaceCauseId,
          ...allocations.map(({ project_id }) => project_id),
        ])
      ),
    [defaultWorkspaceCauseId, allocations]
  );

  const updateAllocationsFromProjectIds = useCallback(
    (projectIds: string[]) => {
      const nextAllocations = recalculateAllocations(
        projectIds,
        defaultWorkspaceCauseId
      );

      setValue('projectAllocations', nextAllocations, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [defaultWorkspaceCauseId, setValue]
  );

  // When country (workspace) changes, the default workspace cause id changes
  // too. Swap the stale id in the form for the new one. Short-circuits when
  // allocations already reference the current defaultWorkspaceCauseId, so mount
  // never dirties the form.
  useEffect(() => {
    const hasWorkspaceDefaultCause = allocations.some(
      ({ project_id }) => project_id === defaultWorkspaceCauseId
    );

    if (allocations.length === 0 || hasWorkspaceDefaultCause) return;

    const reconciledProjectIds = Array.from(
      new Set([
        defaultWorkspaceCauseId,
        ...allocations.map(({ project_id }) =>
          projectDetailsById[project_id] ? project_id : defaultWorkspaceCauseId
        ),
      ])
    );

    updateAllocationsFromProjectIds(reconciledProjectIds);
  }, [
    allocations,
    updateAllocationsFromProjectIds,
    defaultWorkspaceCauseId,
    projectDetailsById,
  ]);

  function handleSelectProject(project: SelectedProject) {
    if (project.id === defaultWorkspaceCauseId) return;
    if (allocations.some(({ project_id }) => project_id === project.id)) {
      return;
    }

    setSessionProjectDetails(prev => ({ ...prev, [project.id]: project }));
    updateAllocationsFromProjectIds([
      ...allocations.map(({ project_id }) => project_id),
      project.id,
    ]);
  }

  function handleRemoveProject(projectId: string) {
    if (projectId === defaultWorkspaceCauseId) return;
    updateAllocationsFromProjectIds(
      allocations
        .filter(({ project_id }) => project_id !== projectId)
        .map(({ project_id }) => project_id)
    );
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
          {displayedAllocations.map((project, index) => {
            const projectImageSource = getProjectImageSource(project.image);
            const isLastProject = index === displayedAllocations.length - 1;

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
        selectedProjectIds={selectedProjectIds}
      />
    </>
  );
}
