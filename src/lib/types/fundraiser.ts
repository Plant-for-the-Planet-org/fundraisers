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

interface FundraiserSettings {
  theme: {
    base_id?: string; // Base theme ID (optional)
    mode?: 'light' | 'dark'; // Override mode (optional)
    accent?: string; // Override accent (optional)
    background?: string; // Override background (optional)
    body_font?: string; // Override body font (optional)
    title_font?: string; // Override title font (optional)
    animation?: string; // Override animation (optional)
  };
  modules: {
    leaderboard?: {
      enabled: boolean;
      view_all: boolean;
      anonymize: boolean;
      default_tab: 'recent' | 'top';
      show_amount: boolean;
      show_top_list: boolean;
      show_recent_list: boolean;
      show_avatar: boolean;
    };
    contribution?: {
      options: Array<{
        unit?: number;
        label?: string | null;
        sub_label?: string | null;
      }>;
      allow_dedication: boolean;
      allow_recurrency: boolean;
    };
    donor_score?: {
      enabled: boolean;
      show_goal: boolean;
      showdays_left: boolean;
    };
    projects_supported?: {
      enabled: boolean;
    };
    custom_fields?: Array<{
      id: number;
      position: number;
      label: string;
      type: 'checkbox' | 'dropdown' | 'text';
      sub_label?: string;
      options?: Array<{ label: string; value: string }>;
      required: boolean;
    }>;
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

// From API response - response structure for a single fundraiser in the list response (GET /fundraisers) and the details response (GET /fundraisers/{id}) is the same
export interface Fundraiser {
  id: string;
  hid: string;
  slug: string;
  title: string;
  description: Nullable<string>;
  image: Nullable<string>;
  goalAmount: number; // in cents
  totalRaised: number; // in cents
  donationCount: number;
  currency: string;
  workspace: Nullable<FundraiserWorkspace>;
  hosts: FundraiserHost[];
  visibility: 'public' | 'private';
  canDonate: boolean;
  projectAllocations: ProjectAllocation[];
  startDate: string;
  endDate: string;
  content: Nullable<Record<string, unknown>>;
  metadata: Nullable<Record<string, unknown>>;
  settings: Nullable<FundraiserSettings>;
}

export interface CreateFundraiserRequest {
  slug?: string; //ASK: when will this be provided?
  title: string;
  description: string;
  country: string; //TODO: update with possible value type
  tags?: string[]; //TODO: confirm whether this is removed
  content: Record<string, unknown>; //For rich text content in the future
  goalAmount: string; // in cents
  currency: string; //TODO: update with possible value type
  visibility: 'public' | 'private' | 'link-only'; //TODO: confirm whether 'link-only' is needed
  status: 'draft' | 'active'; //TODO: confirm possible values for status
  projectAllocations: Array<{
    percentage: number;
    project_id: string;
  }>;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  imageFile?: string; // base64 encoded
  settings: FundraiserSettings;
  metadata?: Record<string, unknown>;
}
