import type { Bundle, BundleTabId, BundleWorkspace } from '@/lib/types/bundle';

import { PLATFORM_BASE_URL } from '@/lib/constants/app-config';
import { BUNDLE_CONFIG } from '@/lib/constants/bundle-config';
import { MIN_DEFAULT_CAUSE_PERCENT } from '@/lib/constants/project-selection';

export function buildProjectLearnMoreUrl(projectId: string): string {
  const normalizedBaseUrl = PLATFORM_BASE_URL.replace(/\/+$/, '');
  return `${normalizedBaseUrl}/${encodeURIComponent(projectId)}?utm_source=fundraiser&utm_medium=cause_selection&utm_campaign=project_link`;
}

export function getBundleBySlug(slug: string): Bundle | undefined {
  return BUNDLE_CONFIG.bundles.find(bundle => bundle.slug === slug);
}

export function getBundlesForTab(tabId: BundleTabId): Bundle[] {
  const tab = BUNDLE_CONFIG.tabs.find(t => t.id === tabId);
  if (!tab) return [];

  const bySlug = new Map(BUNDLE_CONFIG.bundles.map(b => [b.slug, b]));
  return tab.bundleSlugs
    .map(slug => bySlug.get(slug))
    .filter((bundle): bundle is Bundle => bundle !== undefined);
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
 * Allocations with a 25% floor on the support project (always index 0).
 * 5-project bundle → support 28%, others 18% each.
 */
export function bundleToAllocations(
  bundle: Bundle,
  workspace: BundleWorkspace
): Array<{ project_id: string; percentage: number }> {
  // `getBundleProjectIds` always returns at least the support project,
  // so `supportId` is guaranteed to be a string.
  const ids = getBundleProjectIds(bundle, workspace);
  const [supportId, ...otherIds] = ids as [string, ...string[]];

  const equalShare = Math.floor(100 / ids.length);

  // Path 1 — equal split is already generous enough for the support project.
  if (equalShare >= MIN_DEFAULT_CAUSE_PERCENT) {
    const remainder = 100 - equalShare * ids.length;
    return ids.map((project_id, index) => ({
      project_id,
      percentage: equalShare + (index === 0 ? remainder : 0),
    }));
  }

  // Path 2 — boost the support project to the 25% floor.
  if (otherIds.length === 0) {
    return [{ project_id: supportId, percentage: 100 }];
  }
  const remainingPercent = 100 - MIN_DEFAULT_CAUSE_PERCENT;
  const otherShare = Math.floor(remainingPercent / otherIds.length);
  const remainder = remainingPercent - otherShare * otherIds.length;

  return [
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

/**
 * Returns the bundle whose full project ID set (support + curated) exactly
 * matches the given allocations. Order-independent.
 */
export function detectBundleFromAllocations(
  allocations: ReadonlyArray<{ project_id: string }>,
  workspace: BundleWorkspace
): Bundle | undefined {
  const allocationIds = new Set(allocations.map(a => a.project_id));
  return BUNDLE_CONFIG.bundles.find(bundle => {
    const bundleIds = getBundleProjectIds(bundle, workspace);
    if (bundleIds.length !== allocationIds.size) return false;
    return bundleIds.every(id => allocationIds.has(id));
  });
}

/**
 * Picks the most "specific" tab for displaying a bundle's tag — the first
 * non-`staff-picks`, non-`custom` tab. Falls back to `staff-picks` if no
 * better option exists. `custom` is never a valid display tag (bundles
 * don't live on the Custom tab).
 */
export function getDisplayTabForBundle(
  bundle: Bundle
): Exclude<BundleTabId, 'custom'> {
  const specific = bundle.tabs.find(
    (tab): tab is Exclude<BundleTabId, 'custom' | 'staff-picks'> =>
      tab !== 'staff-picks' && tab !== 'custom'
  );
  if (specific) return specific;
  const fallback = bundle.tabs.find(
    (tab): tab is Exclude<BundleTabId, 'custom'> => tab !== 'custom'
  );
  return fallback ?? 'staff-picks';
}

/**
 * Returns a project's display-ready unit cost when it is a measurable physical
 * unit (`tree` or `m2`). Returns `null` for `currency`-typed or missing data so
 * the caller can hide the metric.
 *
 * Format produced (by the locale string): "~{cost} {currency}/{unit}",
 * e.g. unitCost=8, unitType='tree' → "~8 €/tree".
 */
export function getDisplayableUnitCost(
  unitCost: number | undefined,
  unitType: string | undefined
): { value: number; unitType: 'tree' | 'm2' } | null {
  if (unitType !== 'tree' && unitType !== 'm2') return null;
  if (unitCost === undefined || !Number.isFinite(unitCost) || unitCost <= 0) {
    return null;
  }
  return { value: unitCost, unitType };
}
