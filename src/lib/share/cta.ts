import type { ProjectPurpose } from '@/lib/types/project-selection';
import type { SeasonId } from './render/seasons';

/** Button texts a host can pick. Each is a translation key under `Share.cta`. */
export const CTA_PRESETS = [
  'joinMe',
  'supportMyFundraiser',
  'helpUsFinish',
  'yourTurn',
] as const;

export type CtaKey =
  | (typeof CTA_PRESETS)[number]
  | 'giftTree'
  | 'protectForest'
  | 'youngVoices'
  | 'giftForPlanet'
  | 'treatPlanet'
  | 'celebrateWithMe';

/** A custom button text stays short, so it reads as a button and fits every format. */
export const CUSTOM_CTA_MAX_LENGTH = 24;

type PurposeGroup = 'trees' | 'protect' | 'academy' | 'other';

const PURPOSE_GROUPS: Partial<Record<ProjectPurpose, PurposeGroup>> = {
  trees: 'trees',
  reforestation: 'trees',
  conservation: 'protect',
  'forest-protection': 'protect',
  academy: 'academy',
};

const CHRISTMAS_BY_GROUP: Record<PurposeGroup, CtaKey> = {
  trees: 'giftTree',
  protect: 'protectForest',
  academy: 'youngVoices',
  other: 'giftForPlanet',
};

/**
 * The button text a season suggests.
 * Christmas follows what the fundraiser's projects do, since not every project plants trees: mixed or unknown projects get the neutral wording.
 */
export function seasonalCta(
  season: SeasonId,
  purposes: readonly ProjectPurpose[]
): CtaKey {
  switch (season) {
    case 'christmas': {
      const groups = new Set(
        purposes.map(purpose => PURPOSE_GROUPS[purpose] ?? 'other')
      );
      const only = groups.size === 1 ? [...groups][0] : 'other';
      return CHRISTMAS_BY_GROUP[only];
    }
    case 'halloween':
      return 'treatPlanet';
    case 'birthday':
      return 'celebrateWithMe';
    default:
      return 'joinMe';
  }
}
