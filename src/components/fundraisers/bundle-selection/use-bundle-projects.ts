'use client';

import type { BundleWorkspace } from '@/lib/types/bundle';
import type { ProjectData } from '@/lib/types/project-selection';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { projectsService } from '@/lib/api/projects-service';
import { DEFAULT_NON_EARMARKED_CAUSE_FALLBACK } from '@/lib/constants/project-selection';
import { getSupportProjectId } from '@/lib/utils/bundle';

export type ProjectsById = Record<string, ProjectData>;

interface UseBundleProjectsResult {
  projectsById: ProjectsById;
  isLoading: boolean;
  error: boolean;
  refetch: () => void;
  /**
   * Returns a project for the given ID. Falls back to a synthetic record
   * (support project gets the canonical fallback name/image; other unknown
   * IDs get a minimal placeholder).
   */
  getProject: (id: string) => ProjectData;
}

/**
 * Fetches the selectable project list for the workspace once (cached at the
 * service level) and exposes a lookup by ID. Missing IDs get a fallback so
 * the bundle modal always renders 5 rows.
 */
export function useBundleProjects(
  workspace: BundleWorkspace
): UseBundleProjectsResult {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const [projectsById, setProjectsById] = useState<ProjectsById>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const projects = await projectsService.getCauseSelectableProjects(
        workspace,
        locale
      );
      const next: ProjectsById = {};
      for (const project of projects) {
        next[project.id] = project;
      }
      setProjectsById(next);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [locale, workspace]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const supportId = getSupportProjectId(workspace);

  const getProject = useCallback(
    (id: string): ProjectData => {
      const found = projectsById[id];
      if (found) return found;

      if (id === supportId) {
        return {
          id,
          name: DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.name,
          description: DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.description,
          image: DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.image,
          country: workspace,
          allowDonations: true,
          isTopProject: false,
        };
      }

      return {
        id,
        name: t('projectImageAlt', { name: id }),
        description: '',
        country: '',
        allowDonations: true,
        isTopProject: false,
      };
    },
    [projectsById, supportId, workspace, t]
  );

  return {
    projectsById,
    isLoading,
    error,
    refetch: fetchProjects,
    getProject,
  };
}
