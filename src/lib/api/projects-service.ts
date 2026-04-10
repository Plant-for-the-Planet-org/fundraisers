import type { ProjectData } from '@/lib/types/project-selection';

import { API_BASE_URL } from '@/lib/constants/app-config';

interface ProjectsApiEnvelope {
  projects?: unknown[];
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
  const id = typeof rawProject.id === 'string' ? rawProject.id : '';
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
    purpose:
      typeof rawProject.purpose === 'string' ? rawProject.purpose : undefined,
    image: typeof rawProject.image === 'string' ? rawProject.image : undefined,
    tpo: normalizeTpo(rawProject.tpo),
  };
}

export class ProjectsService {
  async getProjects(country?: string, locale?: string): Promise<ProjectData[]> {
    const url = new URL(`${API_BASE_URL}/projects`);

    if (country) {
      url.searchParams.append('country', country);
    }
    if (locale) {
      url.searchParams.append('locale', locale);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch projects: ${response.status} ${response.statusText}`
      );
    }

    const data: unknown = await response.json();
    const projects = Array.isArray(data)
      ? data
      : ((data as ProjectsApiEnvelope)?.projects ?? []);

    return projects.map(normalizeProject).filter(project => project !== null);
  }

  async getCauseSelectableProjects(
    country?: string,
    locale?: string
  ): Promise<ProjectData[]> {
    const projects = await this.getProjects(country, locale);

    return projects.filter(project => project.allowDonations === true);
  }
}

export const projectsService = new ProjectsService();
