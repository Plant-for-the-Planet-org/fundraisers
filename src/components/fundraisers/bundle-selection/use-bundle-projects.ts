'use client';

import type { GetProject, ProjectData } from '@/lib/types/project-selection';
import type { AllowedCountry } from '@/lib/utils/country-currency';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { projectsService } from '@/lib/api/projects-service';
import { DEFAULT_NON_EARMARKED_CAUSE_FALLBACK } from '@/lib/constants/project-selection';
import { getDefaultCauseId } from '@/lib/utils/project-allocation';

type ProjectsById = Record<string, ProjectData>;

interface UseBundleProjectsResult {
  projects: ProjectData[];
  projectsById: ProjectsById;
  isLoading: boolean;
  error: boolean;
  refetch: () => void;
  /**
   * Returns a project for the given ID. Falls back to a synthetic record
   * (the country's default cause gets the canonical fallback name/image;
   * other unknown IDs get a minimal placeholder).
   */
  getProject: GetProject;
}

/**
 * Fetches the selectable project list for the country once (cached at the
 * service level) and exposes a lookup by ID. Missing IDs get a fallback so
 * lookups always return a renderable record.
 */
export function useBundleProjects(
  country: AllowedCountry
): UseBundleProjectsResult {
  const locale = useLocale();
  const t = useTranslations('Bundles');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const fetched = await projectsService.getCauseSelectableProjects(
        country,
        locale
      );
      setProjects(fetched);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [locale, country]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const projectsById = useMemo<ProjectsById>(() => {
    const byId: ProjectsById = {};
    for (const project of projects) {
      byId[project.id] = project;
    }
    return byId;
  }, [projects]);

  const defaultCauseId = useMemo(() => getDefaultCauseId(country), [country]);

  const getProject = useCallback(
    (id: string): ProjectData => {
      const found = projectsById[id];
      if (found) return found;

      if (id === defaultCauseId) {
        return {
          id,
          name: DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.name,
          description: DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.description,
          image: DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.image,
          // ROW (Rest of the World) falls back to DE since the workspace's
          // default cause is physically a German project regardless of the
          // fundraiser's selected country.
          country: country === 'ROW' ? 'DE' : country,
          allowDonations: true,
          isTopProject: false,
        };
      }

      // Unknown projects are treated as non-donatable so they are hidden
      // from bundle views.
      return {
        id,
        name: t('unknownProject'),
        description: '',
        country: '',
        allowDonations: false,
        isTopProject: false,
      };
    },
    [projectsById, defaultCauseId, country, t]
  );

  return {
    projects,
    projectsById,
    isLoading,
    error,
    refetch: fetchProjects,
    getProject,
  };
}
