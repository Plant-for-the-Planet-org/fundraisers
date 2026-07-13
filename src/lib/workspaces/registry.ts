import type { BundleWorkspace } from '@/lib/types/bundle';
import type { AllowedCountry, SupportedCurrency } from './countries';

/**
 * ForestCloud country code accepted by the projects / country API. `'ROW'`
 * (Rest of the World) has no API identity of its own — it is served by the DE
 * workspace, so it is excluded here.
 */
export type ApiCountry = Exclude<AllowedCountry, 'ROW'>;

/**
 * SEPA Direct Debit creditor. These are legal identifiers tied to the
 * organization running the workspace, not to the donor's locale, so they live
 * in the workspace config rather than in translations.
 */
export interface SepaCreditor {
  name: string;
  id: string;
}

/**
 * Everything the app needs to know about a workspace, colocated in one place.
 *
 * Add a field here (and fill it in for every profile below) when a new piece of
 * workspace-specific behavior appears, rather than scattering another
 * per-country map across the codebase.
 */
export interface WorkspaceProfile {
  /** The workspace's base currency. */
  currency: SupportedCurrency;
  /** Whether donations to this workspace are tax-deductible. */
  taxDeductible: boolean;
  /** Whether the donation form requires a donor TIN (tax id). */
  requiresTin: boolean;
  /** Default non-earmarked cause project id used to seed allocations. */
  defaultCauseId: string;
  /** SEPA creditor, or `null` when the workspace never offers SEPA (non-EUR). */
  sepaCreditor: SepaCreditor | null;
  /** Country code used for ForestCloud project / country API calls. */
  apiCountry: ApiCountry;
  /** Bundle workspace, or `null` when only the Custom tab is available. */
  bundleWorkspace: BundleWorkspace | null;
}

const PLANET_FOUNDATION_CREDITOR: SepaCreditor = {
  name: 'Plant-for-the-Planet Foundation',
  id: 'DE94ZZZ00000023303',
};

const PLANET_ESPANA_CREDITOR: SepaCreditor = {
  name: 'Fundación Plant-for-the-Planet España',
  id: 'ES34000G54754031',
};

const DE: WorkspaceProfile = {
  currency: 'EUR',
  taxDeductible: true,
  requiresTin: false,
  defaultCauseId: 'proj_3VU0xgw7jJLDVDkMTpc5FC2w',
  sepaCreditor: PLANET_FOUNDATION_CREDITOR,
  apiCountry: 'DE',
  bundleWorkspace: 'DE',
};

const ES: WorkspaceProfile = {
  currency: 'EUR',
  taxDeductible: true,
  requiresTin: true,
  defaultCauseId: 'proj_zNQk6R8H1C2fCKwrHEUYRHnz',
  sepaCreditor: PLANET_ESPANA_CREDITOR,
  apiCountry: 'ES',
  bundleWorkspace: null,
};

const CH: WorkspaceProfile = {
  currency: 'CHF',
  taxDeductible: false,
  requiresTin: false,
  defaultCauseId: 'proj_YeAk6Y7E3Es2LgHzgQ0aqw8l',
  sepaCreditor: null, // CHF workspace — SEPA is never offered.
  apiCountry: 'CH',
  bundleWorkspace: null,
};

/**
 * Single source of truth for per-workspace configuration.
 *
 * Rest of the World (`ROW`) has no workspace of its own — it is served by the
 * DE workspace. Aliasing `ROW` to the `DE` profile is the ONE place the
 * ROW → DE mapping lives; every accessor derives its ROW behavior from here.
 */
export const WORKSPACE_PROFILES: Record<AllowedCountry, WorkspaceProfile> = {
  DE,
  ES,
  CH,
  ROW: DE,
};

/**
 * Look up the profile for an already-normalized `AllowedCountry`.
 *
 * Callers holding an arbitrary string should coerce with `toAllowedCountry`
 * (from `country-currency.ts`) first, keeping the string-coercion concern in
 * one place.
 */
export function getWorkspaceProfile(country: AllowedCountry): WorkspaceProfile {
  return WORKSPACE_PROFILES[country];
}

/**
 * SEPA creditor for the workspace. Workspaces that never offer SEPA (CHF) fall
 * back to the DE creditor so callers always receive a non-null value —
 * preserving the long-standing behavior of `getSepaCreditor`.
 */
export function getSepaCreditorForCountry(
  country: AllowedCountry
): SepaCreditor {
  return WORKSPACE_PROFILES[country].sepaCreditor ?? PLANET_FOUNDATION_CREDITOR;
}
