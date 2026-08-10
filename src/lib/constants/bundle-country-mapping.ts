import type { BundleWorkspace } from '@/lib/types/bundle';
import type { AllowedCountry } from '@/lib/workspaces/countries';

import { getWorkspaceProfile } from '@/lib/workspaces/registry';

/**
 * Maps a fundraiser's selected country to a bundle workspace.
 *
 * - `DE` and `ROW` (Rest of the World — served by the DE workspace) → `'DE'`
 *   workspace, all bundle tabs available.
 * - `ES`, `CH` → `null`, only the Custom tab is exposed.
 *
 * Backed by `bundleWorkspace` in the workspace registry.
 */
export function getWorkspaceForCountry(
  country: AllowedCountry | undefined
): BundleWorkspace | null {
  if (!country) {
    return null;
  }
  return getWorkspaceProfile(country).bundleWorkspace;
}
