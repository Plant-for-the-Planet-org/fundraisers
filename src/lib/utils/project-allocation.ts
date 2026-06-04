import type {
  ProjectAllocationPreview,
  SelectedProject,
} from '@/lib/types/project-selection';
import type { AllowedCountry } from '@/lib/utils/country-currency';

import {
  DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY,
  DEFAULT_NON_EARMARKED_CAUSE_ID,
  MIN_DEFAULT_CAUSE_PERCENT,
} from '@/lib/constants/project-selection';

function resolveCauseCountry(countryCode: string): string {
  const normalized = countryCode.trim().toUpperCase();
  return normalized === 'ROW' ? 'DE' : normalized;
}

export function getDefaultCauseId(countryCode: string): string {
  const resolvedCountry = resolveCauseCountry(countryCode) as AllowedCountry;

  return (
    DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY[resolvedCountry] ??
    DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY.DE ??
    DEFAULT_NON_EARMARKED_CAUSE_ID
  );
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
