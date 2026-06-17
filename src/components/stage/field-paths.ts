import type { FieldPath } from 'react-hook-form';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

// `stage` is nullable in the form schema, so RHF cannot generate child field
// paths through it. These helpers keep the key argument literal-checked while
// localizing the unavoidable `FieldPath` cast to a single place, instead of
// scattering unchecked casts across every useWatch/setValue/register call.
export type StageModeValues = NonNullable<
  FundraiserFormValues['settings']['modules']['stage']
>;
type StageScalarKey = 'title' | 'description' | 'locale' | 'partner_logo_url';
type StageSlideKey = keyof StageModeValues['slides'][number];

const STAGE_BASE = 'settings.modules.stage';

export const stageField = (
  key: StageScalarKey
): FieldPath<FundraiserFormValues> =>
  `${STAGE_BASE}.${key}` as FieldPath<FundraiserFormValues>;

/** Path to a whole slide object (e.g. for watching the row at once). */
export const slidePath = (idx: number): FieldPath<FundraiserFormValues> =>
  `${STAGE_BASE}.slides.${idx}` as FieldPath<FundraiserFormValues>;

export const slideField = (
  idx: number,
  key: StageSlideKey
): FieldPath<FundraiserFormValues> =>
  `${STAGE_BASE}.slides.${idx}.${key}` as FieldPath<FundraiserFormValues>;
