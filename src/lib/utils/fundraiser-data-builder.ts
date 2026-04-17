import type {
  CreateFundraiserRequest,
  FundraiserSettings,
} from '@/lib/types/fundraiser';
import type { CreateFundraiserFormValues } from '@/components/fundraisers/create-fundraiser-form-context';

export const DEFAULT_MODULES: FundraiserSettings['modules'] = {
  leaderboard: {
    enabled: true,
    show_recent_list: true,
    show_top_list: true,
    show_amount: true,
    view_all: false,
    anonymize: false,
    default_tab: 'recent',
    show_avatar: true,
  },
  contribution: {
    options: [],
    allow_dedication: true,
    allow_recurrency: true,
  },
  donor_score: {
    enabled: true,
    show_goal: true,
    show_days_left: true,
  },
  projects_supported: {
    enabled: true,
  },
  custom_fields: [],
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]!;
}

function getDateOffsetString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]!;
}

export function buildCreateFundraiserRequest(
  values: CreateFundraiserFormValues,
  imageFile?: string
): CreateFundraiserRequest {
  return {
    title: values.title,
    description: values.description,
    country: values.country === 'ROW' ? 'DE' : values.country, // ROW maps to DE (default workspace country) for the API
    currency: values.currency,
    goalAmount: values.goalAmount,
    visibility: values.visibility,
    status: values.status,
    projectAllocations: values.projectAllocations,
    settings: {
      theme: values.settings.theme,
      modules: DEFAULT_MODULES,
    },
    startDate: getTodayString(),
    endDate: getDateOffsetString(30),
    tags: [],
    content: {},
    metadata: {},
    ...(imageFile && { imageFile }),
  };
}
