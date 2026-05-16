'use client';

import type { SelectedProject } from '@/lib/types/project-selection';
import type { AllowedCountry } from '@/lib/utils/country-currency';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { CircleCheck, Lock, Search, SearchX } from 'lucide-react';
import { MIN_DEFAULT_CAUSE_PERCENT } from '@/lib/constants/project-selection';
import {
  calculateProjectAllocations,
  getDefaultCauseId,
} from '@/lib/utils/project-selection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectSearchCard } from './project-search-card';
import { SelectedProjectRow } from './selected-project-row';
import { useBundleProjects } from './use-bundle-projects';

const INITIAL_VISIBLE_COUNT = 6;
const MAX_PROJECTS = 6;

interface CustomTabPanelProps {
  country: AllowedCountry;
}

export function CustomTabPanel({ country }: CustomTabPanelProps) {
  const t = useTranslations('Bundles.custom');
  const { control, setValue } = useFormContext<FundraiserFormValues>();
  const projectAllocations = useWatch<
    FundraiserFormValues,
    'projectAllocations'
  >({ control, name: 'projectAllocations' });
  const allocations = useMemo(
    () => projectAllocations ?? [],
    [projectAllocations]
  );

  const { projects, isLoading, error, refetch, getProject } =
    useBundleProjects(country);

  const defaultCauseId = useMemo(() => getDefaultCauseId(country), [country]);

  // Seed the support project at 100% on first mount when allocations are
  // empty. Runs once per mount so removal is sticky.
  const hasSeededRef = useRef(false);
  useEffect(() => {
    if (hasSeededRef.current) return;
    hasSeededRef.current = true;
    if (allocations.length === 0) {
      setValue(
        'projectAllocations',
        [{ project_id: defaultCauseId, percentage: 100 }],
        { shouldDirty: false, shouldValidate: false }
      );
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const selectedIdSet = useMemo(
    () => new Set(allocations.map(a => a.project_id)),
    [allocations]
  );

  // Pre-lowercase each project's searchable fields once per project list
  // so keystroke filtering doesn't re-stringify every field every render.
  const searchableProjects = useMemo(
    () =>
      projects.map(project => ({
        project,
        haystack: [
          project.name,
          project.description,
          project.country,
          project.tpo?.name ?? '',
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [projects]
  );

  const unselectedProjects = useMemo(
    () =>
      searchableProjects.filter(({ project }) => !selectedIdSet.has(project.id)),
    [searchableProjects, selectedIdSet]
  );

  const topProjects = useMemo(
    () => unselectedProjects.filter(({ project }) => project.isTopProject).map(({ project }) => project),
    [unselectedProjects]
  );

  const filteredProjects = useMemo(() => {
    if (trimmedQuery) {
      return unselectedProjects
        .filter(({ haystack }) => haystack.includes(trimmedQuery))
        .map(({ project }) => project)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    const shuffled = topProjects.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [unselectedProjects, topProjects, trimmedQuery]);

  const visibleProjects = filteredProjects.slice(0, INITIAL_VISIBLE_COUNT);
  const suggestedProjects = topProjects.slice(0, 6);

  function applyAllocationsFromIds(nextIds: string[]) {
    if (nextIds.length === 0) {
      setValue('projectAllocations', [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    const placeholderProjects: SelectedProject[] = nextIds.map(id => ({
      id,
      name: '',
      description: '',
    }));
    const nextAllocations = calculateProjectAllocations(
      placeholderProjects,
      defaultCauseId,
      MIN_DEFAULT_CAUSE_PERCENT
    ).map(project => ({
      project_id: project.id,
      percentage: project.percentage,
    }));
    setValue('projectAllocations', nextAllocations, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleProjectAdd(projectId: string) {
    if (selectedIdSet.has(projectId)) return;
    if (allocations.length >= MAX_PROJECTS) return;
    applyAllocationsFromIds([...allocations.map(a => a.project_id), projectId]);
  }

  function handleProjectRemove(projectId: string) {
    if (projectId === defaultCauseId) return;
    applyAllocationsFromIds(
      allocations
        .map(a => a.project_id)
        .filter(currentId => currentId !== projectId)
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='rounded-xl border border-border/60 bg-muted/50 p-3 shadow-xs sm:p-4'>
        <div className='relative mb-3'>
          {allocations.length >= MAX_PROJECTS ? (
            <Lock
              className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
          ) : (
            <Search
              className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
          )}
          <Input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder={allocations.length >= MAX_PROJECTS ? t('maxReached') : t('searchPlaceholder')}
            className='bg-background pl-10'
            aria-label={t('aria.search')}
            disabled={allocations.length >= MAX_PROJECTS}
          />
        </div>

        {isLoading ? (
          <div className='py-8 text-center'>
            <div className='mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
            <p className='text-sm text-muted-foreground'>{t('loading')}</p>
          </div>
        ) : error ? (
          <div className='py-8 text-center'>
            <p className='font-medium text-foreground'>{t('errorTitle')}</p>
            <p className='mt-1 mb-3 text-sm text-muted-foreground'>
              {t('errorMessage')}
            </p>
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              {t('retry')}
            </Button>
          </div>
        ) : visibleProjects.length === 0 ? (
          trimmedQuery ? (
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <SearchX className='h-4 w-4 shrink-0' aria-hidden='true' />
                  <span>{t('noResults', { query: searchQuery })}</span>
                </div>
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  className='text-xs font-medium text-foreground underline-offset-2 hover:underline'
                >
                  {t('clearSearch')}
                </button>
              </div>
              {suggestedProjects.length > 0 && (
                <div className='flex flex-col gap-2'>
                  <p className='text-xs text-muted-foreground'>{t('youMightLike')}</p>
                  <div className='columns-1 gap-2 sm:columns-2 [&>*]:mb-2 [&>*]:break-inside-avoid'>
                    {suggestedProjects.map(project => (
                      <ProjectSearchCard
                        key={project.id}
                        project={project}
                        onAdd={() => handleProjectAdd(project.id)}
                        disabled={allocations.length >= MAX_PROJECTS}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : projects.length > 0 ? (
            <div className='py-8 text-center'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10'>
                <CircleCheck
                  className='h-6 w-6 text-muted-foreground'
                  aria-hidden='true'
                />
              </div>
              <p className='font-semibold text-foreground'>
                {t('allAddedTitle')}
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t('allAddedDescription')}
              </p>
            </div>
          ) : (
            <p className='py-8 text-center text-sm text-muted-foreground'>
              {t('emptyState')}
            </p>
          )
        ) : (
          <>
            <div className='columns-1 gap-2 sm:columns-2 [&>*]:mb-2 [&>*]:break-inside-avoid'>
              {visibleProjects.map(project => (
                <ProjectSearchCard
                  key={project.id}
                  project={project}
                  onAdd={() => handleProjectAdd(project.id)}
                />
              ))}
            </div>
            {filteredProjects.length > INITIAL_VISIBLE_COUNT && (
                <p className='mt-3 text-center text-xs italic text-muted-foreground'>
                  {t('showingCount', {
                    shown: visibleProjects.length,
                    total: filteredProjects.length,
                  })}
                </p>
              )}
          </>
        )}
      </div>

      <div className='rounded-xl border border-border/60 bg-muted/50 p-3 shadow-xs sm:p-4'>
        <p className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          {t('yourBundle')}
        </p>
        <p className='mt-1 mb-3 text-base font-semibold text-foreground'>
          {t('projectCount', { count: allocations.length })}
        </p>

        {allocations.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            {t('emptyState')}
          </p>
        ) : (
          <ul className='flex flex-col gap-2'>
            {allocations.map(({ project_id, percentage }) => (
              <SelectedProjectRow
                key={project_id}
                project={getProject(project_id)}
                percentage={percentage}
                isDefaultCause={project_id === defaultCauseId}
                onRemove={() => handleProjectRemove(project_id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
