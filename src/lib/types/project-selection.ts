import type { AllowedCountry } from '@/lib/utils/country-currency';

export interface ProjectData {
  id: string;
  slug?: string;
  name: string;
  description: string;
  allowDonations: boolean;
  isTopProject: boolean;
  country: string;
  purpose?: string;
  image?: string;
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
