import type {
  ProjectData,
  ProjectPurpose,
} from '@/lib/types/project-selection';
import type { ApiCountry } from '@/lib/workspaces/registry';
import type { AllowedCountry } from '../workspaces/countries';

import { platformFetch } from '@/lib/api/platform-fetch';
import { PROJECT_PURPOSES } from '@/lib/types/project-selection';
import { getWorkspaceProfile } from '@/lib/workspaces/registry';

function resolveProjectsApiCountry(countryCode: AllowedCountry): ApiCountry {
  return getWorkspaceProfile(countryCode).apiCountry;
}

interface ProjectsApiEnvelope {
  projects?: unknown[];
}

const PROJECT_PURPOSE_SET: ReadonlySet<string> = new Set(PROJECT_PURPOSES);

function isProjectPurpose(value: string): value is ProjectPurpose {
  return PROJECT_PURPOSE_SET.has(value);
}

function normalizePurpose(purpose: unknown): ProjectPurpose | undefined {
  if (typeof purpose !== 'string') {
    return undefined;
  }

  return isProjectPurpose(purpose) ? purpose : undefined;
}

function normalizeTpo(tpo: unknown): ProjectData['tpo'] | undefined {
  if (!tpo || typeof tpo !== 'object') {
    return undefined;
  }

  const tpoRecord = tpo as Record<string, unknown>;
  if (typeof tpoRecord.name !== 'string' || tpoRecord.name.length === 0) {
    return undefined;
  }

  return {
    name: tpoRecord.name,
    image: typeof tpoRecord.image === 'string' ? tpoRecord.image : undefined,
  };
}

function normalizeProject(project: unknown): ProjectData | null {
  if (!project || typeof project !== 'object') {
    return null;
  }

  const rawProject = project as Record<string, unknown>;
  const id = typeof rawProject.guid === 'string' ? rawProject.guid : '';
  const name = typeof rawProject.name === 'string' ? rawProject.name : '';

  if (!id || !name) {
    return null;
  }

  return {
    id,
    slug: typeof rawProject.slug === 'string' ? rawProject.slug : undefined,
    name,
    description:
      typeof rawProject.description === 'string' ? rawProject.description : '',
    allowDonations: rawProject.allowDonations === true,
    isTopProject: rawProject.isTopProject === true,
    country: typeof rawProject.country === 'string' ? rawProject.country : '',
    purpose: normalizePurpose(rawProject.purpose),
    image: typeof rawProject.image === 'string' ? rawProject.image : undefined,
    tpo: normalizeTpo(rawProject.tpo),
  };
}

export class ProjectsService {
  private readonly cache = new Map<string, ProjectData[]>();

  async getProjects(
    country: AllowedCountry,
    locale?: string
  ): Promise<ProjectData[]> {
    const apiCountry = resolveProjectsApiCountry(country);
    const path = locale
      ? `/countryProjects/${apiCountry}?locale=${encodeURIComponent(locale)}`
      : `/countryProjects/${apiCountry}`;

    const data = await platformFetch<unknown>(path);
    const projects = Array.isArray(data)
      ? data
      : ((data as ProjectsApiEnvelope)?.projects ?? []);

    return projects.map(normalizeProject).filter(project => project !== null);
  }

  async getCauseSelectableProjects(
    country: AllowedCountry,
    locale?: string
  ): Promise<ProjectData[]> {
    const apiCountry = resolveProjectsApiCountry(country);
    const cacheKey = `${apiCountry}|${locale ?? ''}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const projects = await this.getProjects(country, locale);
    const selectable = projects.filter(
      project =>
        project.allowDonations === true &&
        (project.purpose === 'trees' || project.purpose === 'conservation')
    );
    this.cache.set(cacheKey, selectable);
    return selectable;
  }
}

export const projectsService = new ProjectsService();
