export const BUNDLE_TAB_IDS = [
  'staff-picks',
  'wonder',
  'rage',
  'love',
  'custom',
] as const;

// When adding a slug, also add `Bundles.entries.<slug>.{label,tagline}` to
// locales/{en,de}/bundles.json — otherwise the UI renders the raw key.
export const BUNDLE_SLUGS = [
  'ancestral-lands',
  'fix-what-we-broke',
  'for-your-children',
  'roof-of-the-world',
  'supply-chain-guilt-trip',
  'amazon-route',
  'underdog-bundle',
  'undo-your-amazon-order',
  'where-your-coffee-grows',
  'worst-of-the-worst',
] as const;

export type BundleTabId = (typeof BUNDLE_TAB_IDS)[number];
export type BundleSlug = (typeof BUNDLE_SLUGS)[number];

export const BUNDLE_WORKSPACES = ['DE'] as const;

export type BundleWorkspace = (typeof BUNDLE_WORKSPACES)[number];

export interface Bundle {
  slug: BundleSlug;
  /** Config-only — not consumed at runtime. Derive tab from BundleTab.bundleSlugs instead. Can remove in future if not needed. */
  tabs: BundleTabId[];
  /** 4 curated project IDs. The workspace's support project is added at runtime. */
  projectIds: string[];
}

export interface BundleTab {
  id: BundleTabId;
  bundleSlugs: BundleSlug[];
}

export interface BundleConfig {
  meta: {
    version: string;
    workspace: BundleWorkspace;
    defaultTab: Exclude<BundleTabId, 'custom'>;
  };
  tabs: BundleTab[];
  bundles: Bundle[];
  supportProjects: Record<BundleWorkspace, string>;
}
