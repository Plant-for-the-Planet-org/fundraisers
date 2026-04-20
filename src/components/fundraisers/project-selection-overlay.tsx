'use client';

import type {
  ProjectData,
  SelectedProject,
} from '@/lib/types/project-selection';
import type { AllowedCountry } from '@/lib/utils/country-currency';
import type { CreateFundraiserFormValues } from '@/components/fundraisers/create-fundraiser-form-context';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Target, X } from 'lucide-react';
import { projectsService } from '@/lib/api/projects-service';
import { API_BASE_URL } from '@/lib/constants/app-config';
import { getImageUrl } from '@/lib/utils/images';
import { mapProjectToSelectedCause } from '@/lib/utils/project-selection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ProjectSelectionTab = 'top' | 'all';

interface ProjectSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: SelectedProject) => void;
  selectedProjectIds: string[];
}

function getProjectImageSource(image?: string): string | null {
  if (!image) {
    return null;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return getImageUrl('project', 'small', image);
}

function buildLearnMoreUrl(projectId: string): string {
  const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  return `${normalizedBaseUrl}/${projectId}?utm_source=fundraiser&utm_medium=cause_selection&utm_campaign=project_link`;
}

export function ProjectSelectionOverlay({
  isOpen,
  onClose,
  onSelectProject,
  selectedProjectIds,
}: ProjectSelectionOverlayProps) {
  const t = useTranslations('Fundraisers.form.projectSelection');
  const locale = useLocale();
  const country = useWatch<CreateFundraiserFormValues, 'country'>({
    name: 'country',
  });
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectSelectionTab>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);

  const countryDisplayNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: 'region' }),
    [locale]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchProjects = useCallback(
    async (countryCode: AllowedCountry, locale?: string) => {
      setIsLoading(true);
      setLoadError(false);

      try {
        const projects = await projectsService.getCauseSelectableProjects(
          countryCode,
          locale
        );
        setAllProjects(projects);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen || isLoading) {
      return;
    }

    if (!country) {
      setLoadError(true);
      return;
    }

    fetchProjects(country, locale);
  }, [allProjects.length, country, fetchProjects, isLoading, isOpen, locale]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleCloseOverlay = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleCloseOverlay();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCloseOverlay, isOpen]);

  const visibleProjects = useMemo(() => {
    let filteredProjects = allProjects;

    if (activeTab === 'top') {
      filteredProjects = filteredProjects.filter(
        project => project.isTopProject === true
      );
    }

    filteredProjects = filteredProjects.filter(
      project => !selectedProjectIds.includes(project.id)
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      filteredProjects = filteredProjects.filter(project => {
        return (
          project.name.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.country.toLowerCase().includes(query) ||
          project.tpo?.name?.toLowerCase().includes(query)
        );
      });
    }

    return filteredProjects;
  }, [activeTab, allProjects, searchQuery, selectedProjectIds]);

  function handleSelectProject(project: ProjectData) {
    onSelectProject(mapProjectToSelectedCause(project));
    handleCloseOverlay();
  }

  function getCountryLabel(countryCode: string): string {
    const normalizedCountryCode = countryCode.trim().toUpperCase();

    if (!normalizedCountryCode) {
      return '';
    }

    if (normalizedCountryCode === 'ROW') {
      return t('modal.tags.restOfWorld');
    }

    if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) {
      return normalizedCountryCode;
    }

    return (
      countryDisplayNames.of(normalizedCountryCode) ?? normalizedCountryCode
    );
  }

  function getPurposeLabel(purpose?: string): string | null {
    if (!purpose) {
      return null;
    }

    if (purpose === 'trees') {
      return t('modal.tags.restoration');
    }

    if (purpose === 'conservation') {
      return t('modal.tags.conservation');
    }

    return purpose;
  }

  if (!isOpen || !isMounted) {
    return null;
  }

  return createPortal(
    <div
      className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[10vh]'
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          handleCloseOverlay();
        }
      }}
    >
      <div className='w-full max-w-2xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden'>
        <div className='px-4 pt-4 pb-2 border-b border-border'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h2 className='text-xl font-semibold text-foreground'>
                {t('modal.title')}
              </h2>
              <p className='text-sm text-muted-foreground mt-1'>
                {t('modal.subtitle')}
              </p>
            </div>
            <button
              type='button'
              onClick={handleCloseOverlay}
              className='p-2 hover:bg-muted rounded-full transition-colors'
              aria-label={t('aria.closeModal')}
            >
              <X className='w-5 h-5 text-muted-foreground' />
            </button>
          </div>

          <div className='relative mb-4'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={t('modal.searchPlaceholder')}
              className='pl-10 border-border bg-transparent'
              autoFocus
              aria-label={t('modal.searchAriaLabel')}
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as ProjectSelectionTab)}
          >
            <TabsList>
              <TabsTrigger value='top'>{t('modal.tabs.top')}</TabsTrigger>
              <TabsTrigger value='all'>{t('modal.tabs.all')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {searchQuery && (
            <p className='text-xs text-muted-foreground mt-2'>
              {t('modal.resultsCount', { count: visibleProjects.length })}
            </p>
          )}
        </div>

        <div className='max-h-[60vh] overflow-y-auto'>
          {isLoading ? (
            <div className='p-8 text-center'>
              <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3' />
              <p className='text-sm text-muted-foreground'>
                {t('modal.loading')}
              </p>
            </div>
          ) : loadError ? (
            <div className='p-8 text-center'>
              <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <X className='w-6 h-6 text-red-600' />
              </div>
              <h3 className='font-medium text-foreground mb-1'>
                {t('modal.errorTitle')}
              </h3>
              <p className='text-sm text-muted-foreground mb-3'>
                {t('modal.errorMessage')}
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => country && fetchProjects(country, locale)}
              >
                {t('modal.retry')}
              </Button>
            </div>
          ) : visibleProjects.length > 0 ? (
            <div className='divide-y divide-border'>
              {visibleProjects.map(project => {
                const projectImageSource = getProjectImageSource(project.image);
                const countryLabel = getCountryLabel(project.country);
                const purposeLabel = getPurposeLabel(project.purpose);

                return (
                  <div
                    key={project.id}
                    role='button'
                    tabIndex={0}
                    className='group block hover:bg-muted/40 rounded-lg transition-colors cursor-pointer'
                    onClick={() => handleSelectProject(project)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectProject(project);
                      }
                    }}
                    aria-label={t('aria.selectCause', { name: project.name })}
                  >
                    <div className='flex items-start gap-3 px-4 py-3'>
                      <div className='w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0'>
                        {projectImageSource ? (
                          <img
                            src={projectImageSource}
                            alt={t('projectImageAlt', { name: project.name })}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <Target className='w-5 h-5 text-muted-foreground' />
                          </div>
                        )}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-foreground line-clamp-2'>
                          {project.name}
                        </p>
                        <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                          {project.description}
                        </p>
                        {project.tpo?.name && (
                          <p className='text-xs text-muted-foreground mt-2'>
                            {t('modal.byOrganization', {
                              organization: project.tpo.name,
                            })}
                          </p>
                        )}

                        <div className='flex items-center gap-2 text-xs text-muted-foreground mt-2'>
                          {project.isTopProject && (
                            <>
                              <span className='flex items-center gap-1 text-amber-600 dark:text-amber-400'>
                                <span>✨</span>
                                <span>{t('modal.tags.topProject')}</span>
                              </span>
                              <span>•</span>
                            </>
                          )}

                          {countryLabel && (
                            <>
                              <span>{countryLabel}</span>
                              <span>•</span>
                            </>
                          )}

                          {purposeLabel && (
                            <>
                              <span className='px-2 py-0.5 bg-muted rounded-full capitalize'>
                                {purposeLabel}
                              </span>
                              <span>•</span>
                            </>
                          )}

                          <a
                            href={buildLearnMoreUrl(project.id)}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:text-primary/80 font-medium'
                            onClick={event => event.stopPropagation()}
                          >
                            {t('modal.tags.learnMore')}
                          </a>
                        </div>
                      </div>

                      <div className='self-start text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity'>
                        {t('modal.add')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='p-8 text-center'>
              <div className='w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3'>
                <Target className='w-6 h-6 text-muted-foreground' />
              </div>
              {searchQuery ? (
                <>
                  <h3 className='font-medium text-foreground mb-1'>
                    {t('modal.emptySearchTitle')}
                  </h3>
                  <p className='text-sm text-muted-foreground mb-3'>
                    {t('modal.emptySearchDescription', { query: searchQuery })}
                  </p>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSearchQuery('')}
                  >
                    {t('modal.clearSearch')}
                  </Button>
                </>
              ) : (
                <>
                  <h3 className='font-medium text-foreground mb-1'>
                    {t('modal.emptyAllTitle')}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {t('modal.emptyAllDescription')}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
