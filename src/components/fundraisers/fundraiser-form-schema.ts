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
import {
  isValidAnimation,
  isValidDecoration,
  isValidImageMode,
} from '@/lib/theme/backgrounds';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { isValidMode } from '@/lib/theme/validators';
import { BUNDLE_SLUGS } from '@/lib/types/bundle';
import { bundleToAllocations, getBundlesForTab } from '@/lib/utils/bundle';
import {
  ALLOWED_COUNTRIES,
  getCurrencyForCountry,
  SUPPORTED_CURRENCIES,
} from '@/lib/utils/country-currency';
import { getImageUrl } from '@/lib/utils/images';
import { getDefaultCauseId } from '@/lib/utils/project-allocation';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { STAGE_LIMITS } from '@/components/stage/constants';
import { routing } from '@/i18n/routing';

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

// Trusted hostnames for stage images. Prevents javascript:/data: injection and SSRF.
const ALLOWED_IMAGE_HOSTNAME_SUFFIXES = [
  'plant-for-the-planet.org',
  'unsplash.com',
  'cloudinary.com',
  'amazonaws.com',
  'imgix.net',
  'googleusercontent.com',
] as const;

function isAllowedImageUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_IMAGE_HOSTNAME_SUFFIXES.some(
      suffix => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

const stageImageUrlSchema = z
  .string()
  .refine(isAllowedImageUrl, { message: 'imageUrlNotAllowed' });

const stageSlideSchema = z.object({
  position: z.number().int().min(1),
  title: z.string().max(STAGE_LIMITS.slideTitle),
  description: z.string().max(STAGE_LIMITS.slideDescription),
  image: stageImageUrlSchema,
  duration: z.number().int().min(1).max(60),
});

export const stageModeSchema = z.object({
  enabled: z.boolean(),
  locale: z.enum(routing.locales),
  title: z.string().max(STAGE_LIMITS.stageTitle),
  description: z.string().max(STAGE_LIMITS.stageDescription),
  partner_logo_url: stageImageUrlSchema,
  slides: z.array(stageSlideSchema).max(STAGE_LIMITS.maxSlides),
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
      body_font: z.string(),
      title_font: z.string(),
      bg: z.object({
        gradient: z.string(),
        decoration: z.enum(['none', 'pattern', 'image', 'logo']),
        pattern_id: z.string().nullable(),
        // External URLs must use https and be from an allowed host (same list
        // as stage images). Library keys (no https:// prefix) are passed
        // through and validated at render time via resolveBgAsset.
        image_url: z
          .string()
          .nullable()
          .refine(
            value => {
              if (value === null) return true;
              if (/^https?:\/\//i.test(value)) return isAllowedImageUrl(value);
              return true;
            },
            { message: 'imageUrlNotAllowed' }
          ),
        image_mode: z.enum(['cover', 'repeat']),
        logo_id: z.string().nullable(),
        opacity: z.number().min(0.05).max(1),
        animation: z.enum(['none', 'snow', 'confetti', 'hearts', 'fireworks']),
      }),
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
      bundle: z.object({
        slug: z.enum(BUNDLE_SLUGS).nullable(),
      }),
      stage: stageModeSchema.nullable(),
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
        body_font: initialTheme.bodyFont,
        title_font: initialTheme.titleFont,
        bg: initialTheme.bg,
      },
      modules: {
        leaderboard: { ...DEFAULT_LEADERBOARD },
        bundle: { slug: defaultBundle?.slug ?? null },
        stage: null,
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

  const storedBundleSlug = fundraiser.settings?.modules?.bundle?.slug;
  const bundleSlug = (BUNDLE_SLUGS as readonly string[]).includes(
    storedBundleSlug ?? ''
  )
    ? (storedBundleSlug as (typeof BUNDLE_SLUGS)[number])
    : null;

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
        mode: isValidMode(theme.mode) ? theme.mode : fallbackTheme.mode,
        accent: theme.accent ?? fallbackTheme.accent,
        body_font: theme.body_font ?? fallbackTheme.bodyFont,
        title_font: theme.title_font ?? fallbackTheme.titleFont,
        bg: {
          gradient: theme.bg?.gradient ?? fallbackTheme.bg.gradient,
          decoration: isValidDecoration(theme.bg?.decoration)
            ? theme.bg.decoration
            : fallbackTheme.bg.decoration,
          pattern_id:
            theme.bg?.pattern_id !== undefined
              ? theme.bg.pattern_id
              : fallbackTheme.bg.pattern_id,
          image_url:
            theme.bg?.image_url !== undefined
              ? theme.bg.image_url
              : fallbackTheme.bg.image_url,
          image_mode: isValidImageMode(theme.bg?.image_mode)
            ? theme.bg.image_mode
            : fallbackTheme.bg.image_mode,
          logo_id:
            theme.bg?.logo_id !== undefined
              ? theme.bg.logo_id
              : fallbackTheme.bg.logo_id,
          opacity:
            typeof theme.bg?.opacity === 'number'
              ? Math.min(1, Math.max(0.05, theme.bg.opacity))
              : fallbackTheme.bg.opacity,
          // Phase 1 records stored animation at the top level (theme.animation).
          // Phase 2 moved it into bg.animation. Read both for back-compat.
          animation: isValidAnimation(theme.bg?.animation)
            ? theme.bg.animation
            : isValidAnimation(theme.animation)
              ? theme.animation
              : fallbackTheme.bg.animation,
        },
      },
      modules: {
        leaderboard: {
          ...DEFAULT_LEADERBOARD,
          ...fundraiser.settings?.modules?.leaderboard,
        },
        bundle: { slug: bundleSlug },
        stage: fundraiser.settings?.modules?.stage ?? null,
      },
    },
  };
}
