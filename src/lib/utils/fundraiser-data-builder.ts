import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import type {
  CreateFundraiserRequest,
  FundraiserSettings,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { getWorkspaceProfile } from '@/lib/workspaces/registry';
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

function isDonorScoreDirty(dirty: UpdateDirtyFields): boolean {
  const donorScore = dirty.settings?.modules?.donor_score;
  if (!donorScore) return false;
  if (typeof donorScore === 'boolean') return donorScore;
  return Object.values(donorScore).some(Boolean);
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

function isThankYouNoteDirty(dirty: UpdateDirtyFields): boolean {
  const thankYouNote = dirty.settings?.modules?.thankYouNote;
  if (!thankYouNote) return false;
  if (typeof thankYouNote === 'boolean') return thankYouNote;
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

// The gradient editor keeps stops in insertion order, but CSS linear-gradient
// clamps a stop whose position dips below the previous one. Persist them sorted
// so the saved fundraiser renders the same gradient the editor previewed.
function themeWithSortedGradient(
  theme: FundraiserFormValues['settings']['theme']
): FundraiserFormValues['settings']['theme'] {
  const cg = theme.bg?.custom_gradient;
  if (!cg?.stops) return theme;
  return {
    ...theme,
    bg: {
      ...theme.bg,
      custom_gradient: {
        ...cg,
        stops: [...cg.stops].sort((a, b) => a.position - b.position),
      },
    },
  };
}

export function buildUpdateFundraiserRequest(
  values: FundraiserFormValues,
  dirtyFields: UpdateDirtyFields,
  imageFile?: string,
  existingSettings?: FundraiserSettings | null
): UpdateFundraiserRequest {
  const request: UpdateFundraiserRequest = {};

  if (dirtyFields.slug && values.slug) request.slug = values.slug;
  if (dirtyFields.title) request.title = values.title;
  if (dirtyFields.description) request.description = values.description;
  if (dirtyFields.goalAmount) request.goalAmount = values.goalAmount;
  if (dirtyFields.visibility) request.visibility = values.visibility;
  if (dirtyFields.status) request.status = values.status;
  if (isProjectAllocationsDirty(dirtyFields)) {
    request.projectAllocations = values.projectAllocations;
  }

  const isSettingsDirty =
    isThemeDirty(dirtyFields) ||
    isLeaderboardDirty(dirtyFields) ||
    isStageDirty(dirtyFields) ||
    isThankYouNoteDirty(dirtyFields) ||
    isBundleDirty(dirtyFields) ||
    isDonorScoreDirty(dirtyFields);

  if (isSettingsDirty) {
    // `settings` is a free-form JSON blob the backend can edit directly, so a stored value may hold keys that are in neither the form schema nor our TS types.
    // Where that's possible, merge the form value onto the stored one instead of replacing it, or those backend-set keys are dropped on save (see `stage`).
    // Nullable slots (null means "removed") must guard the merge: spreading null is a no-op that would resurrect the slot as `{}`.
    request.settings = {
      theme: themeWithSortedGradient(values.settings.theme),
      modules: {
        // Spread server modules first to preserve non-form keys
        // (contribution, projects_supported, custom_fields).
        // Form-managed keys follow and override.
        ...existingSettings?.modules,
        leaderboard: values.settings.modules.leaderboard,
        bundle: values.settings.modules.bundle,
        stage: values.settings.modules.stage
          ? {
              ...existingSettings?.modules?.stage, // keep backend-set keys the form omits (show_impact, show_progress_bar)
              ...values.settings.modules.stage, // form-managed fields override
            }
          : values.settings.modules.stage, // null = removed; pass through unchanged
        thankYouNote: values.settings.modules.thankYouNote,
        donor_score: {
          enabled: existingSettings?.modules?.donor_score?.enabled ?? true,
          ...values.settings.modules.donor_score,
        },
      },
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
    country: getWorkspaceProfile(values.country).apiCountry, // ROW is served by the DE workspace for the API
    currency: values.currency,
    goalAmount: values.goalAmount,
    visibility: values.visibility,
    status: values.status,
    projectAllocations: values.projectAllocations,
    settings: {
      theme: themeWithSortedGradient(values.settings.theme),
      modules: {
        ...DEFAULT_MODULES,
        leaderboard: values.settings.modules.leaderboard,
        bundle: values.settings.modules.bundle,
        stage: values.settings.modules.stage,
        thankYouNote: values.settings.modules.thankYouNote,
        donor_score: {
          enabled: true,
          ...values.settings.modules.donor_score,
        },
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
