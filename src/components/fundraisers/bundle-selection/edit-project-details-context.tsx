'use client';

import type { ReactNode } from 'react';
import type { ProjectAllocation } from '@/lib/types/fundraiser';
import type { ProjectData } from '@/lib/types/project-selection';

import { createContext, useContext, useMemo } from 'react';

type ProjectDetailsById = Record<string, ProjectData>;

/**
 * Project details sourced from the fundraiser being edited. The cause-selectable
 * projects API omits non-donatable projects, so `useBundleProjects` cannot
 * resolve them. The saved fundraiser still carries their details on
 * `projectAllocations[].project`, so we surface those here as a fallback.
 *
 * Empty in create mode (no provider), which is why non-donatable projects stay
 * hidden there.
 */
const EditProjectDetailsContext = createContext<ProjectDetailsById>({});

export function EditProjectDetailsProvider({
  allocations,
  children,
}: {
  allocations: ProjectAllocation[];
  children: ReactNode;
}) {
  const value = useMemo<ProjectDetailsById>(() => {
    const byId: ProjectDetailsById = {};
    for (const { project } of allocations) {
      byId[project.id] = {
        id: project.id,
        name: project.name,
        description: project.description,
        image: project.image || undefined,
        allowDonations: project.allowDonations,
        // Non-donatable project views do not require country, purpose, or top-project data.
        isTopProject: false,
        country: '',
      };
    }
    return byId;
  }, [allocations]);

  return (
    <EditProjectDetailsContext.Provider value={value}>
      {children}
    </EditProjectDetailsContext.Provider>
  );
}

export function useEditProjectDetails(): ProjectDetailsById {
  return useContext(EditProjectDetailsContext);
}
