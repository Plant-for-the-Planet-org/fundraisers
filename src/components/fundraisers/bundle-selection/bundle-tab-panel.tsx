'use client';

import type { Bundle, BundleTabId, BundleWorkspace } from '@/lib/types/bundle';
import type { ProjectData } from '@/lib/types/project-selection';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { getBundlesForTab } from '@/lib/utils/bundle';
import { BundleCard } from './bundle-card';

interface BundleTabPanelProps {
  activeTab: BundleTabId;
  workspace: BundleWorkspace;
  selectedBundleSlug: string | undefined;
  getProject: (id: string) => ProjectData;
  onSelectBundle: (bundle: Bundle) => void;
  onOpenBundle: (bundle: Bundle) => void;
}

export function BundleTabPanel({
  activeTab,
  workspace,
  selectedBundleSlug,
  getProject,
  onSelectBundle,
  onOpenBundle,
}: BundleTabPanelProps) {
  const t = useTranslations('Bundles');
  const bundles = useMemo(() => getBundlesForTab(activeTab), [activeTab]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='columns-1 gap-4 md:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid'>
        {bundles.map(bundle => (
          <BundleCard
            key={bundle.slug}
            bundle={bundle}
            workspace={workspace}
            isSelected={selectedBundleSlug === bundle.slug}
            getProject={getProject}
            onSelect={() => onSelectBundle(bundle)}
            onOpen={() => onOpenBundle(bundle)}
          />
        ))}
      </div>
    </div>
  );
}
