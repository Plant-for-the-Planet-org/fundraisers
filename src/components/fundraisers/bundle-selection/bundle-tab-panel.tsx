'use client';

import type {
  Bundle,
  BundleSlug,
  BundleTabId,
  BundleWorkspace,
} from '@/lib/types/bundle';
import type { GetProject } from '@/lib/types/project-selection';

import { useMemo } from 'react';
import { getBundlesForTab } from '@/lib/utils/bundle';
import { BundleCard } from './bundle-card';

interface BundleTabPanelProps {
  activeTab: BundleTabId;
  bundleWorkspace: BundleWorkspace;
  currentBundleSlug: BundleSlug | undefined;
  persistedBundleSlug: BundleSlug | null;
  getProject: GetProject;
  onSelectBundle: (bundle: Bundle) => void;
  onOpenBundle: (bundle: Bundle) => void;
}

export function BundleTabPanel({
  activeTab,
  bundleWorkspace,
  currentBundleSlug,
  persistedBundleSlug,
  getProject,
  onSelectBundle,
  onOpenBundle,
}: BundleTabPanelProps) {
  const bundles = useMemo(() => getBundlesForTab(activeTab), [activeTab]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='columns-1 gap-4 md:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid'>
        {bundles.map(bundle => (
          <BundleCard
            key={bundle.slug}
            bundle={bundle}
            bundleWorkspace={bundleWorkspace}
            isSelected={currentBundleSlug === bundle.slug}
            isPersisted={persistedBundleSlug === bundle.slug}
            getProject={getProject}
            onSelect={() => onSelectBundle(bundle)}
            onOpen={() => onOpenBundle(bundle)}
          />
        ))}
      </div>
    </div>
  );
}
