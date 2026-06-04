import type { Bundle, BundleTabId, BundleWorkspace } from '@/lib/types/bundle';
import type { GetProject } from '@/lib/types/project-selection';

import { PLATFORM_BASE_URL } from '@/lib/constants/app-config';
import { BUNDLE_CONFIG } from '@/lib/constants/bundle-config';
import { MIN_DEFAULT_CAUSE_PERCENT } from '@/lib/constants/project-selection';

export function buildProjectUrl(projectId: string): string {
  const normalizedBaseUrl = PLATFORM_BASE_URL.replace(/\/+$/, '');
  return `${normalizedBaseUrl}/${encodeURIComponent(projectId)}`;
}

/**
 * Looks up a bundle by slug.
 * Accepts `string | null | undefined` so callers don't need to pre-validate
 * values from forms or persisted fundraiser settings.
 * Returns `undefined` for unknown or legacy slugs.
 */
export function getBundleBySlug(
  slug: string | null | undefined
): Bundle | undefined {
  if (!slug) return undefined;
  return BUNDLE_CONFIG.bundles.find(b => b.slug === slug);
}

export function getBundlesForTab(tabId: BundleTabId): Bundle[] {
  const tab = BUNDLE_CONFIG.tabs.find(t => t.id === tabId);
  if (!tab) return [];

  const bySlug = new Map(BUNDLE_CONFIG.bundles.map(b => [b.slug, b]));
  return tab.bundleSlugs
    .map(slug => bySlug.get(slug))
    .filter(bundle => bundle !== undefined);
}

export function getSupportProjectId(workspace: BundleWorkspace): string {
  return BUNDLE_CONFIG.supportProjects[workspace];
}

/**
 * Combines the workspace's support project with the bundle's 4 curated IDs.
 * The support project is always at index 0.
 */
export function getBundleProjectIds(
  bundle: Bundle,
  workspace: BundleWorkspace
): string[] {
  return [getSupportProjectId(workspace), ...bundle.projectIds];
}
/**
 * Bundle project IDs with non-donatable projects removed.
 * Used to hide projects that no longer accept donations.
 */
export function getDonatableBundleProjectIds(
  bundle: Bundle,
  workspace: BundleWorkspace,
  getProject: GetProject
): string[] {
  return getBundleProjectIds(bundle, workspace).filter(
    id => getProject(id).allowDonations
  );
}

/**
 * Allocations with a 25% minimum for the support project (index 0).
 * Example: a 5-project bundle gets 28% for support and 18% for each other project.
 *
 * When `getProject` is provided, non-donatable projects are excluded from the
 * allocation and their share is redistributed among donatable projects, then
 * added back with `percentage: 0` so the API receives the full bundle list.
 * These 0% entries are ignored by donation flows and hidden in the UI. Both the
 * create and edit forms pass `getProject` for this reason.
 */
export function bundleToAllocations(
  bundle: Bundle,
  workspace: BundleWorkspace,
  getProject?: GetProject
): Array<{ project_id: string; percentage: number }> {
  // `getBundleProjectIds` always returns at least the support project,
  // so `supportId` is guaranteed to be a string.
  const ids = getProject
    ? getDonatableBundleProjectIds(bundle, workspace, getProject)
    : getBundleProjectIds(bundle, workspace);
  const [supportId, ...otherIds] = ids as [string, ...string[]];

  const equalShare = Math.floor(100 / ids.length);

  let allocations: Array<{ project_id: string; percentage: number }>;

  if (equalShare >= MIN_DEFAULT_CAUSE_PERCENT) {
    // Path 1 — equal split is already generous enough for the support project.
    const remainder = 100 - equalShare * ids.length;
    allocations = ids.map((project_id, index) => ({
      project_id,
      percentage: equalShare + (index === 0 ? remainder : 0),
    }));
  } else {
    // Path 2 — boost the support project to the 25% floor.
    const remainingPercent = 100 - MIN_DEFAULT_CAUSE_PERCENT;
    const otherShare = Math.floor(remainingPercent / otherIds.length);
    const remainder = remainingPercent - otherShare * otherIds.length;

    allocations = [
      {
        project_id: supportId,
        percentage: MIN_DEFAULT_CAUSE_PERCENT + remainder,
      },
      ...otherIds.map(project_id => ({
        project_id,
        percentage: otherShare,
      })),
    ];
  }

  // Non-donatable projects remain in the payload with 0% allocation instead of
  // being dropped, so the API receives the full bundle list.
  if (getProject) {
    const donatable = new Set(ids);
    const zeroAllocations = getBundleProjectIds(bundle, workspace)
      .filter(id => !donatable.has(id))
      .map(project_id => ({ project_id, percentage: 0 }));
    return [...allocations, ...zeroAllocations];
  }

  return allocations;
}
