import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import type {
  CreateFundraiserRequest,
  Fundraiser,
  FundraiserSettings,
  UpdateFundraiserRequest,
} from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { getWorkspaceProfile } from '@/lib/workspaces/registry';
import { registeredModules } from '@/modules';
import { DEFAULT_FUNDRAISER_DURATION_DAYS } from '../constants/fundraiser-creation';
import { getCurrencyForCountry, toAllowedCountry } from './country-currency';

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

/** `2026-03-03T00:00:00+00:00` -> `2026-03-03`. Null when unparseable. */
function toDateOnly(value: string | null | undefined): string | null {
  const datePart = value?.slice(0, 10);
  return datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

// The fundraiser form has no date fields, so a clone that inherited an
// already-finished window could never be corrected. Keep the source window
// while it still runs; otherwise start a fresh one like the create flow does.
function buildCloneDateWindow(source: Fundraiser): {
  startDate: string;
  endDate: string;
} {
  const startDate = toDateOnly(source.startDate);
  const endDate = toDateOnly(source.endDate);

  if (startDate && endDate && endDate >= getTodayString()) {
    return { startDate, endDate };
  }

  return {
    startDate: getTodayString(),
    endDate: getDateOffsetString(DEFAULT_FUNDRAISER_DURATION_DAYS),
  };
}

/** Drops the settings of every registered module that opted out of cloning. */
function applyModuleClonePolicy(
  modules: FundraiserSettings['modules']
): FundraiserSettings['modules'] {
  const cloned: Record<string, unknown> = { ...modules };

  for (const descriptor of registeredModules) {
    if (descriptor.clone === 'reset') {
      delete cloned[descriptor.settingsKey];
    }
  }

  return cloned as FundraiserSettings['modules'];
}

/**
 * Builds the create payload for a copy of an existing fundraiser.
 *
 * Everything the host configured carries over: description, theme, projects,
 * goal, module settings, content and metadata. What identifies the original
 * does not: id, hid, slug, donations and hosts are left to the API, and the
 * copy always starts as a draft so it can be reviewed before it goes live.
 * `title` comes from the clone dialog, and `imageFile` is the re-uploaded
 * cover image (the API takes base64 only, never a reference to a stored file).
 */
export function buildCloneFundraiserRequest(
  source: Fundraiser,
  title: string,
  imageFile?: string
): CreateFundraiserRequest {
  const country = toAllowedCountry(source.workspace?.country);

  return {
    title,
    description: source.description ?? '',
    country: getWorkspaceProfile(country).apiCountry,
    currency: source.currency?.toUpperCase() ?? getCurrencyForCountry(country),
    goalAmount: source.goalAmount,
    visibility: source.visibility,
    status: 'draft',
    projectAllocations: source.projectAllocations.map(allocation => ({
      project_id: allocation.project.id,
      percentage: allocation.percentage,
    })),
    settings: {
      // Every field of the stored theme is optional, so an empty object is a
      // valid theme: buildTheme falls back to DEFAULT_THEME.
      theme: source.settings?.theme ?? {},
      modules: applyModuleClonePolicy({
        ...DEFAULT_MODULES,
        ...source.settings?.modules,
      }),
    },
    ...buildCloneDateWindow(source),
    tags: [],
    content: source.content ?? {},
    metadata: source.metadata ?? {},
    ...(imageFile && { imageFile }),
  };
}
