import type { SepaCreditor } from '@/lib/workspaces/registry';

import { toAllowedCountry } from '@/lib/utils/country-currency';
import { getSepaCreditorForCountry } from '@/lib/workspaces/registry';

export type { SepaCreditor };

/**
 * SEPA Direct Debit creditor for a workspace, keyed by the workspace country
 * code. Creditor details live in the workspace registry.
 *
 * Always returns a creditor: workspaces that never offer SEPA (CHF) and
 * unknown/empty countries fall back to DE (which ROW is also served by), so
 * callers can rely on a non-null result.
 */
export function getSepaCreditor(country: string | undefined): SepaCreditor {
  return getSepaCreditorForCountry(toAllowedCountry(country));
}
