export const PROJECT_PURPOSES = [
  'trees',
  'conservation',
  'funds',
  'academy',
  'endowment',
  'forest-protection',
  'sponsorship',
  'membership',
  'planet-cash',
  'reforestation',
  'bouquet',
] as const;

export type ProjectPurpose = (typeof PROJECT_PURPOSES)[number];

export interface ProjectData {
  id: string;
  slug?: string;
  name: string;
  description: string;
  allowDonations: boolean;
  isTopProject: boolean;
  country: string;
  purpose?: ProjectPurpose;
  image?: string;
  tpo?: {
    name: string;
    image?: string;
  };
  /**
   * True only for the synthetic placeholder `getProject` returns when an ID
   * cannot be resolved (not in the cause-selectable API, not the default cause,
   * and not in the edited fundraiser's allocations). Callers use it to skip
   * rendering unresolvable bundle-config projects. See `useBundleProjects`.
   */
  isUnknown?: boolean;
}

/**
 * Resolves a project by ID, returning a renderable record even for unknown
 * IDs (callers get a fallback rather than `undefined`). See `useBundleProjects`.
 */
export type GetProject = (id: string) => ProjectData;

export interface SelectedProject {
  id: string;
  name: string;
  description: string;
  image?: string;
  country?: string;
  isDefault?: boolean;
}

export interface ProjectAllocationPreview extends SelectedProject {
  percentage: number;
  isDefault: boolean;
}
