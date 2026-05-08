export const BUNDLE_TAB_IDS = [
  'staff-picks',
  'wonder',
  'rage',
  'love',
  'custom',
] as const;

export type BundleTabId = (typeof BUNDLE_TAB_IDS)[number];

export const BUNDLE_WORKSPACES = ['DE'] as const;

export type BundleWorkspace = (typeof BUNDLE_WORKSPACES)[number];

export interface Bundle {
  slug: string;
  label: string;
  tabs: BundleTabId[];
  tagline: string;
  /** 4 curated project IDs. The workspace's support project is added at runtime. */
  projectIds: string[];
}

export interface BundleTab {
  id: BundleTabId;
  label: string;
  description: string;
  bundleSlugs: string[];
}

export interface BundleConfig {
  meta: {
    version: string;
    workspace: BundleWorkspace;
    defaultTab: Exclude<BundleTabId, 'custom'>;
    tagline: string;
    subline: string;
  };
  tabs: BundleTab[];
  bundles: Bundle[];
  supportProjects: Record<BundleWorkspace, string>;
}
