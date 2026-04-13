import type {
  ProjectAllocationPreview,
  ProjectData,
  SelectedProject,
} from '@/lib/types/project-selection';
import type { AllowedCountry } from '@/lib/utils/country-currency';

import {
  DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY,
  DEFAULT_NON_EARMARKED_CAUSE_FALLBACK,
  DEFAULT_NON_EARMARKED_CAUSE_ID,
  MIN_DEFAULT_CAUSE_PERCENT,
} from '@/lib/constants/project-selection';

function normalizeCountryCode(countryCode?: string | null): string {
  return (countryCode ?? '').trim().toUpperCase();
}

export function resolveCauseCountry(countryCode: string): string {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  return normalizedCountryCode === 'ROW' ? 'DE' : normalizedCountryCode;
}

export function getDefaultCauseId(countryCode: string): string {
  const resolvedCountry = resolveCauseCountry(countryCode) as AllowedCountry;

  return (
    DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY[resolvedCountry] ??
    DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY.DE ??
    DEFAULT_NON_EARMARKED_CAUSE_ID
  );
}

export function mapProjectToSelectedCause(
  project: ProjectData
): SelectedProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    image: project.image,
    country: project.country,
  };
}

interface DefaultCauseFallback {
  name?: string;
  description?: string;
  image?: string;
}

export function createDefaultCause(
  countryCode: string,
  projects: ProjectData[] = [],
  fallback: DefaultCauseFallback = {}
): SelectedProject {
  const defaultCauseId = getDefaultCauseId(countryCode);
  const defaultCauseFromProjects = projects.find(
    project => project.id === defaultCauseId
  );

  if (defaultCauseFromProjects) {
    return {
      ...mapProjectToSelectedCause(defaultCauseFromProjects),
      isDefault: true,
    };
  }

  return {
    id: defaultCauseId,
    name: fallback.name?.trim() || DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.name,
    description:
      fallback.description?.trim() ||
      DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.description,
    image: fallback.image || DEFAULT_NON_EARMARKED_CAUSE_FALLBACK.image,
    country: resolveCauseCountry(countryCode),
    isDefault: true,
  };
}

function equalSplitAllocations(
  projects: SelectedProject[],
  defaultCauseId: string
): ProjectAllocationPreview[] {
  if (projects.length === 0) {
    return [];
  }

  const equalShare = Math.floor(100 / projects.length);
  const remainder = 100 - equalShare * projects.length;

  return projects.map((project, index) => ({
    ...project,
    percentage: equalShare + (index === 0 ? remainder : 0),
    isDefault: project.id === defaultCauseId,
  }));
}

export function calculateProjectAllocations(
  projects: SelectedProject[],
  defaultCauseId: string,
  minDefaultPercent: number | null = MIN_DEFAULT_CAUSE_PERCENT
): ProjectAllocationPreview[] {
  if (!projects || projects.length === 0) {
    return [];
  }

  const normalizedMinDefaultPercent =
    minDefaultPercent == null
      ? null
      : Math.max(0, Math.min(100, minDefaultPercent));

  if (projects.length === 1) {
    const [singleProject] = projects;

    return [
      {
        ...singleProject,
        percentage: 100,
        isDefault: singleProject?.id === defaultCauseId,
      },
    ];
  }

  const defaultCause = projects.find(project => project.id === defaultCauseId);

  if (!defaultCause) {
    return equalSplitAllocations(projects, defaultCauseId);
  }

  const equalShare = Math.floor(100 / projects.length);
  const useEqualDivision =
    normalizedMinDefaultPercent == null ||
    normalizedMinDefaultPercent === 0 ||
    equalShare >= normalizedMinDefaultPercent;

  if (useEqualDivision) {
    return equalSplitAllocations(projects, defaultCauseId);
  }

  const otherProjects = projects.filter(
    project => project.id !== defaultCauseId
  );

  if (otherProjects.length === 0) {
    return [
      {
        ...defaultCause,
        percentage: 100,
        isDefault: true,
      },
    ];
  }

  const remainingPercent = 100 - normalizedMinDefaultPercent;
  const otherShare = Math.floor(remainingPercent / otherProjects.length);
  const remainder = remainingPercent - otherShare * otherProjects.length;

  return [
    {
      ...defaultCause,
      percentage: normalizedMinDefaultPercent + remainder,
      isDefault: true,
    },
    ...otherProjects.map(project => ({
      ...project,
      percentage: otherShare,
      isDefault: false,
    })),
  ];
}
