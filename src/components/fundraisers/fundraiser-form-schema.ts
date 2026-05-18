import type {
  Fundraiser,
  LeaderboardModuleSettings,
} from '@/lib/types/fundraiser';
import type { SelectedImage } from '@/lib/types/image-selection';
import type { AllowedCountry } from '@/lib/utils/country-currency';

import { z } from 'zod';
import { BUNDLE_CONFIG } from '@/lib/constants/bundle-config';
import { getWorkspaceForCountry } from '@/lib/constants/bundle-country-mapping';
import { GOAL_AMOUNT_MIN } from '@/lib/constants/fundraiser-creation';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { bundleToAllocations, getBundlesForTab } from '@/lib/utils/bundle';
import {
  ALLOWED_COUNTRIES,
  getCurrencyForCountry,
  SUPPORTED_CURRENCIES,
} from '@/lib/utils/country-currency';
import { getImageUrl } from '@/lib/utils/images';
import { getDefaultCauseId } from '@/lib/utils/project-allocation';
import { getRichTextTextContent } from '@/lib/utils/rich-text';

const DEFAULT_LEADERBOARD: LeaderboardModuleSettings = {
  enabled: true,
  view_all: false,
  anonymize: false,
  default_tab: 'recent',
  show_amount: true,
  show_top_list: true,
  show_recent_list: true,
  show_avatar: true,
  aggregate_top_by_donor: true,
};

const unsplashAttributionSchema = z.object({
  photographer: z.string(),
  photographerUrl: z.string(),
  unsplashUrl: z.string(),
});

const selectedImageSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  originalUrl: z.string().optional(),
  attribution: unsplashAttributionSchema.optional(),
  source: z.enum(['unsplash', 'upload']),
  uploadStatus: z.enum(['pending', 'uploading', 'completed', 'failed']),
  downloadLocation: z.string().optional(),
  file: z.unknown().optional(),
});

const projectAllocationSchema = z.object({
  project_id: z.string().trim().min(1),
  percentage: z.number().int().min(1).max(100),
});

export const fundraiserFormSchema = z.object({
  title: z.string().trim().min(1).max(50),
  description: z
    .string()
    .refine(value => getRichTextTextContent(value).length > 0),
  image: selectedImageSchema.nullable(),
  country: z.enum(ALLOWED_COUNTRIES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  goalAmount: z
    .number({ error: 'required' })
    .int()
    .min(GOAL_AMOUNT_MIN, 'minAmount'),
  visibility: z.enum(['public', 'unlisted']),
  status: z.enum(['draft', 'active']),
  projectAllocations: z.array(projectAllocationSchema).min(1, 'required'),
  settings: z.object({
    theme: z.object({
      base_id: z.string(),
      mode: z.enum(['light', 'dark']),
      accent: z.string(),
      background: z.string(),
      body_font: z.string(),
      title_font: z.string(),
      animation: z.string(),
    }),
    modules: z.object({
      leaderboard: z.object({
        enabled: z.boolean(),
        view_all: z.boolean(),
        anonymize: z.boolean(),
        default_tab: z.enum(['recent', 'top']),
        show_amount: z.boolean(),
        show_top_list: z.boolean(),
        show_recent_list: z.boolean(),
        show_avatar: z.boolean(),
        aggregate_top_by_donor: z.boolean(),
      }),
    }),
  }),
});

export type FundraiserFormValues = z.infer<typeof fundraiserFormSchema>;

function isAllowedCountry(code: string): code is AllowedCountry {
  return (ALLOWED_COUNTRIES as readonly string[]).includes(code);
}

export function buildDefaultCreateValues(
  pathname: string
): FundraiserFormValues {
  const initialTheme = getThemeForPath(pathname);
  const defaultCountry: AllowedCountry = 'DE';

  const workspace = getWorkspaceForCountry(defaultCountry);
  const defaultBundle = workspace
    ? getBundlesForTab(BUNDLE_CONFIG.meta.defaultTab)[0]
    : undefined;
  const projectAllocations =
    workspace && defaultBundle
      ? bundleToAllocations(defaultBundle, workspace)
      : [{ project_id: getDefaultCauseId(defaultCountry), percentage: 100 }];

  return {
    title: '',
    description: '',
    image: null,
    country: defaultCountry,
    currency: getCurrencyForCountry(defaultCountry),
    goalAmount: undefined as unknown as number,
    visibility: 'public',
    status: 'draft',
    projectAllocations,
    settings: {
      theme: {
        base_id: initialTheme.id,
        mode: initialTheme.mode,
        accent: initialTheme.accent,
        background: initialTheme.background,
        body_font: initialTheme.bodyFont,
        title_font: initialTheme.titleFont,
        animation: initialTheme.animation ?? 'none',
      },
      modules: {
        leaderboard: { ...DEFAULT_LEADERBOARD },
      },
    },
  };
}

function buildExistingSelectedImage(
  image: string | null | undefined
): SelectedImage | null {
  if (!image) {
    return null;
  }

  const isAbsoluteUrl = /^https?:\/\//i.test(image);
  const url = isAbsoluteUrl ? image : getImageUrl('fundraiser', 'large', image);
  const thumbnailUrl = isAbsoluteUrl
    ? image
    : getImageUrl('fundraiser', 'small', image);

  if (!url || !thumbnailUrl) {
    return null;
  }

  return {
    url,
    thumbnailUrl,
    source: 'upload',
    uploadStatus: 'completed',
  };
}

export function fundraiserToFormValues(
  fundraiser: Fundraiser
): FundraiserFormValues {
  const fallbackTheme = getThemeForPath('/');
  const theme = fundraiser.settings?.theme ?? {};

  const rawCountry = fundraiser.workspace?.country?.toUpperCase() ?? 'DE';
  const country: AllowedCountry = isAllowedCountry(rawCountry)
    ? rawCountry
    : 'ROW';

  return {
    title: fundraiser.title,
    description: fundraiser.description ?? '',
    image: buildExistingSelectedImage(fundraiser.image),
    country,
    currency: getCurrencyForCountry(country),
    goalAmount: fundraiser.goalAmount,
    visibility: fundraiser.visibility,
    status: fundraiser.canDonate ? 'active' : 'draft',
    projectAllocations: fundraiser.projectAllocations.map(allocation => ({
      project_id: allocation.project.id,
      percentage: allocation.percentage,
    })),
    settings: {
      theme: {
        base_id: theme.base_id ?? fallbackTheme.id,
        mode: theme.mode ?? fallbackTheme.mode,
        accent: theme.accent ?? fallbackTheme.accent,
        background: theme.background ?? fallbackTheme.background,
        body_font: theme.body_font ?? fallbackTheme.bodyFont,
        title_font: theme.title_font ?? fallbackTheme.titleFont,
        animation: theme.animation ?? fallbackTheme.animation ?? 'none',
      },
      modules: {
        leaderboard: {
          ...DEFAULT_LEADERBOARD,
          ...fundraiser.settings?.modules?.leaderboard,
        },
      },
    },
  };
}
