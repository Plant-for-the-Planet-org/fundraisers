import type { FundraiserThemeSettings } from '../theme/types';
import type { Nullable } from './utility';
import type { Locale } from '@/i18n/routing';

export type RecurrencyType = 'once' | 'monthly' | 'quarterly' | 'yearly';

export interface ContributionOption {
  amount_cent: number | 'custom';
  label?: string | null;
  sub_label?: string | null;
  default?: boolean;
  min?: number;
}

export interface ContributionModuleSettings {
  recurrency_options?: RecurrencyType[];
  options?: ContributionOption[];
  allow_dedication?: boolean;
  allow_recurrency?: boolean;
  show_totals_on_fundraiser?: boolean;
}

export interface FundraiserUser {
  id: string;
  name: string;
  avatar: Nullable<string>;
}

export type FundraiserHostType = 'user' | 'team';
/**
 * 'admin' (full edit + manage hosts) and 'viewer' (read-only dashboard) are the
 * supported roles.
 */
export type FundraiserHostRole = 'admin' | 'viewer';
/** 'invited' hosts have no profile yet; claimed to 'active' on first login. */
export type FundraiserHostStatus = 'active' | 'invited';
export interface FundraiserHost {
  id: string;
  user: Nullable<FundraiserUser>;
  hostType: FundraiserHostType;
  role: FundraiserHostRole;
  isPublic: boolean;
  displayName: Nullable<string>;
  displayOrder: Nullable<number>;
  status: FundraiserHostStatus;
  // Invariant: invitedEmail is non-null only when status === 'invited' (user is
  // null). When status === 'active', user is non-null and invitedEmail is null.
  // Not enforced as a discriminated union (YAGNI — all call sites guard via ??
  // chains or status checks). Refactor to discriminated union if this type
  // spreads beyond host management components.
  invitedEmail: Nullable<string>;
}

export interface AddFundraiserHostRequest {
  email: string;
  role: FundraiserHostRole;
  isPublic: boolean;
  displayName?: string;
  displayOrder?: number;
}

// ponytail: all fields intentionally optional for partial updates. An empty
// object {} is technically valid TypeScript but no call site constructs one —
// every caller passes at least one field. Add RequireAtLeastOne<T> from
// utility.ts if a conditional-build code path is ever introduced.
export interface UpdateFundraiserHostRequest {
  role?: FundraiserHostRole;
  isPublic?: boolean;
  displayName?: string;
  displayOrder?: number;
}

export interface FundraiserWorkspace {
  country: string;
  name: string;
  address: {
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
}

export interface LeaderboardModuleSettings {
  enabled: boolean;
  view_all: boolean;
  anonymize: boolean;
  default_tab: 'recent' | 'top';
  show_amount: boolean;
  show_top_list: boolean;
  show_recent_list: boolean;
  show_avatar: boolean;
  aggregate_top_by_donor: boolean;
}

export interface StageSlide {
  position: number;
  title: string;
  description: string;
  image: string;
  duration: number;
}

export interface StageModuleSettings {
  enabled: boolean;
  locale: Locale;
  title: string;
  description: string;
  partner_logo_url: string;
  slides: StageSlide[];
  show_impact?: boolean;
  show_progress_bar?: boolean;
}

export interface ThankYouNoteModuleSettings {
  enabled: boolean;
  message: string;
}

export interface FundraiserSettings {
  theme: FundraiserThemeSettings;
  modules: {
    leaderboard?: LeaderboardModuleSettings;
    bundle?: {
      slug: string | null;
    };
    stage?: StageModuleSettings | null;
    thankYouNote?: ThankYouNoteModuleSettings | null;
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
      show_days_left: boolean;
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

export interface ProjectAllocation {
  project: {
    id: string;
    name: string;
    description: string;
    image: string;
    allowDonations: boolean;
  };
  percentage: number;
}

export type FundraiserStatus =
  | 'draft'
  | 'active'
  | 'cancelled'
  | 'completed'
  | 'paused';
export type FundraiserVisibility = 'public' | 'unlisted';

// From API response - response structure for a single fundraiser in the list response (GET /fundraisers) and the details response (GET /fundraisers/{id}) is the same
export interface Fundraiser {
  id: string;
  hid: string;
  slug: string;
  title: string;
  description: Nullable<string>;
  image: Nullable<string>;
  goalAmount: number; // Integer, not in cents
  totalRaised: Record<string, number>; // currency-keyed, e.g. { EUR: 2052.85 }
  donationCount: number;
  currency: string;
  workspace: Nullable<FundraiserWorkspace>;
  hosts: FundraiserHost[];
  visibility: FundraiserVisibility;
  status: FundraiserStatus;
  canDonate: boolean;
  projectAllocations: ProjectAllocation[];
  startDate: string;
  endDate: string;
  content: Nullable<Record<string, unknown>>;
  metadata: Nullable<Record<string, unknown>>;
  settings: Nullable<FundraiserSettings>;
}

export interface UpdateFundraiserRequest {
  title?: string;
  description?: string;
  goalAmount?: number;
  visibility?: FundraiserVisibility;
  status?: FundraiserStatus;
  projectAllocations?: Array<{
    percentage: number;
    project_id: string;
  }>;
  settings?: {
    theme: FundraiserSettings['theme'];
    modules: FundraiserSettings['modules'];
  };
  imageFile?: string; // base64 encoded, only sent when image changed
}

export interface CreateFundraiserRequest {
  /** Needs to be unique. Database error if duplicate */
  slug?: string;
  title: string;
  description: string;
  country: string; //TODO: update with possible value type
  tags?: string[]; //TODO: confirm whether this is removed
  content: Record<string, unknown>; //For rich text content in the future. JSON type
  goalAmount: number; // send as integer value. NOT IN CENTS. No decimals possible.
  currency: string; //TODO: update with possible value type
  visibility: FundraiserVisibility;
  status: FundraiserStatus;
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
