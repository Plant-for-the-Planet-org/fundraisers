import type { AllowedCountry } from '@/lib/utils/country-currency';

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

export type ProjectUnitType = 'tree' | 'm2' | 'currency';

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
  /** Cost per unit, in the project's currency. */
  unitCost?: number;
  /** What `unitCost` is denominated in — e.g. one tree, one m², one currency unit. */
  unitType?: ProjectUnitType;
  tpo?: {
    name: string;
    image?: string;
  };
}

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

export type DefaultCauseIdByCountry = Partial<Record<AllowedCountry, string>>;
