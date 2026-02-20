import type { Nullable } from './utility';

interface FundraiserUser {
  id: string;
  name: string;
  avatar: Nullable<string>;
}

// TODO: check possible values for role (other than owner) and status (other than active)
interface FundraiserHost {
  id: string;
  user: Nullable<FundraiserUser>;
  hostType: 'user' | 'team';
  role: string;
  isPublic: boolean;
  displayName: Nullable<string>;
  displayOrder: Nullable<number>;
  status: string;
}

interface FundraiserWorkspace {
  country: string;
  name: string;
  address: {
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
}

interface ProjectAllocation {
  project: {
    id: string;
    name: string;
    description: string;
    image: string;
  };
  percentage: number;
}

export interface Fundraiser {
  id: string;
  hid: string;
  slug: string;
  title: string;
  description: Nullable<string>;
  image: Nullable<string>;
  goalAmount: number;
  totalRaised: number;
  donationCount: number;
  currency: string;
  visibility: 'public' | 'private';
  canDonate: boolean;
  hosts: FundraiserHost[];
  workspace: Nullable<FundraiserWorkspace>;
  projectAllocations: ProjectAllocation[];
}
