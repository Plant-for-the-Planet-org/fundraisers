import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import type {
  CreateFundraiserRequest,
  FundraiserSettings,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { DEFAULT_FUNDRAISER_DURATION_DAYS } from '../constants/fundraiser-creation';

export type UpdateDirtyFields = Partial<
  Readonly<FieldNamesMarkedBoolean<FundraiserFormValues>>
>;

function isThemeDirty(dirty: UpdateDirtyFields): boolean {
  const theme = dirty.settings?.theme;
  if (!theme) return false;
  if (typeof theme === 'boolean') return theme;
  return Object.values(theme).some(Boolean);
}

function isLeaderboardDirty(dirty: UpdateDirtyFields): boolean {
  const leaderboard = dirty.settings?.modules?.leaderboard;
  if (!leaderboard) return false;
  if (typeof leaderboard === 'boolean') return leaderboard;
  return Object.values(leaderboard).some(Boolean);
}

function isBundleDirty(dirty: UpdateDirtyFields): boolean {
  const bundle = dirty.settings?.modules?.bundle;
  if (!bundle) return false;
  if (typeof bundle === 'boolean') return bundle;
  return Object.values(bundle).some(Boolean);
}

function isStageDirty(dirty: UpdateDirtyFields): boolean {
  const stage = dirty.settings?.modules?.stage;
  if (!stage) return false;
  if (typeof stage === 'boolean') return stage;
  return true;
}

function isThankYouMessageDirty(dirty: UpdateDirtyFields): boolean {
  const thankYouMessage = dirty.settings?.modules?.thankYouMessage;
  if (!thankYouMessage) return false;
  if (typeof thankYouMessage === 'boolean') return thankYouMessage;
  return true;
}

function isProjectAllocationsDirty(dirty: UpdateDirtyFields): boolean {
  const allocations = dirty.projectAllocations;
  if (!allocations) return false;
  if (!Array.isArray(allocations)) return Boolean(allocations);
  return allocations.some(entry =>
    entry ? Object.values(entry).some(Boolean) : false
  );
}

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
    aggregate_top_by_donor: true,
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

export function buildUpdateFundraiserRequest(
  values: FundraiserFormValues,
  dirtyFields: UpdateDirtyFields,
  imageFile?: string
): UpdateFundraiserRequest {
  const request: UpdateFundraiserRequest = {};

  if (dirtyFields.title) request.title = values.title;
  if (dirtyFields.description) request.description = values.description;
  if (dirtyFields.goalAmount) request.goalAmount = values.goalAmount;
  if (dirtyFields.visibility) request.visibility = values.visibility;
  if (dirtyFields.status) request.status = values.status;
  if (isProjectAllocationsDirty(dirtyFields)) {
    request.projectAllocations = values.projectAllocations;
  }
  if (isThemeDirty(dirtyFields)) {
    request.settings = { ...request.settings, theme: values.settings.theme };
  }
  // Each module's dirty check and value are kept together here.
  // New modules: add an if-block below, nowhere else.
  const dirtyModules: Partial<FundraiserSettings['modules']> = {};
  if (isLeaderboardDirty(dirtyFields))
    dirtyModules.leaderboard = values.settings.modules.leaderboard;
  if (isStageDirty(dirtyFields))
    dirtyModules.stage = values.settings.modules.stage;
  if (isThankYouMessageDirty(dirtyFields))
    dirtyModules.thankYouMessage = values.settings.modules.thankYouMessage;
  if (isBundleDirty(dirtyFields))
    dirtyModules.bundle = values.settings.modules.bundle;
  if (Object.keys(dirtyModules).length > 0) {
    request.settings = {
      ...request.settings,
      modules: { ...request.settings?.modules, ...dirtyModules },
    };
  }
  if (imageFile) request.imageFile = imageFile;

  return request;
}

export function buildCreateFundraiserRequest(
  values: FundraiserFormValues,
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
      modules: {
        ...DEFAULT_MODULES,
        leaderboard: values.settings.modules.leaderboard,
        bundle: values.settings.modules.bundle,
        thankYouMessage: values.settings.modules.thankYouMessage,
      },
    },
    startDate: getTodayString(),
    endDate: getDateOffsetString(DEFAULT_FUNDRAISER_DURATION_DAYS),
    tags: [],
    content: {},
    metadata: {},
    ...(imageFile && { imageFile }),
  };
}
