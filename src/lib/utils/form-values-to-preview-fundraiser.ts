import type {
  Fundraiser,
  FundraiserHost,
  ProjectAllocation,
} from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { DEFAULT_FUNDRAISER_DURATION_DAYS } from '@/lib/constants/fundraiser-creation';

// Fraction of the goal shown as "already raised" so the progress bar has
// something to render in the preview.
const PREVIEW_RAISED_FRACTION = 0.4;
const PREVIEW_DONATION_COUNT = 12;

function dateOffsetString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]!;
}

/**
 * Builds a throwaway {@link Fundraiser} from the current form values so the
 * preview renderer can reuse the public display components. Fields the form
 * does not hold (raised amount, donor count, workspace, ...) are filled with
 * dummy data — the preview is never persisted or fetched.
 *
 * `projectAllocations` (resolved to full project details) and `hosts` are
 * supplied by the caller — the form only stores `project_id`/`percentage` and
 * no hosts, so both are reconstructed outside this mapper.
 */
export function formValuesToPreviewFundraiser(
  values: FundraiserFormValues,
  {
    projectAllocations,
    hosts,
  }: { projectAllocations: ProjectAllocation[]; hosts: FundraiserHost[] }
): Fundraiser {
  // ROW maps to DE (default workspace country) for tax/security display.
  const country = values.country === 'ROW' ? 'DE' : values.country;

  return {
    id: 'preview',
    hid: 'preview',
    slug: 'preview',
    title: values.title,
    description: values.description,
    image: values.image?.url ?? null,
    goalAmount: values.goalAmount,
    totalRaised: {
      [values.currency]: Math.round(
        values.goalAmount * PREVIEW_RAISED_FRACTION
      ),
    },
    donationCount: PREVIEW_DONATION_COUNT,
    currency: values.currency,
    workspace: {
      country,
      name: 'Plant-for-the-Planet',
      address: { address: '', city: '', zipCode: '', country },
    },
    hosts,
    visibility: values.visibility,
    status: values.status,
    canDonate: true,
    projectAllocations,
    startDate: dateOffsetString(0),
    endDate: dateOffsetString(DEFAULT_FUNDRAISER_DURATION_DAYS),
    content: {},
    metadata: {},
    settings: {
      theme: values.settings.theme,
      modules: {
        ...values.settings.modules,
        // The form omits donor_score.enabled; the view type requires it.
        donor_score: { enabled: true, ...values.settings.modules.donor_score },
      },
    },
  };
}
