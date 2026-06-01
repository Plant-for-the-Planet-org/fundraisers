import type { BundleWorkspace } from '@/lib/types/bundle';
import type { AllowedCountry } from '@/lib/utils/country-currency';

/**
 * Maps a fundraiser's selected country to a bundle workspace.
 *
 * - `DE` and `ROW` (Rest of the World — uses DE as default) → `'DE'` workspace, all bundle tabs available.
 * - `ES`, `CH` → `null`, only the Custom tab is exposed.
 *
 * Add new entries here when more workspaces ship.
 */
const COUNTRY_TO_WORKSPACE: Record<AllowedCountry, BundleWorkspace | null> = {
  DE: 'DE',
  ROW: 'DE',
  ES: null,
  CH: null,
};

export function getWorkspaceForCountry(
  country: AllowedCountry | undefined
): BundleWorkspace | null {
  if (!country) {
    return null;
  }
  return COUNTRY_TO_WORKSPACE[country] ?? null;
}
