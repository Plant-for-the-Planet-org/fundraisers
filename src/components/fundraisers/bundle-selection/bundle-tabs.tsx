'use client';

import type { Bundle, BundleTabId } from '@/lib/types/bundle';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { BUNDLE_CONFIG } from '@/lib/constants/bundle-config';
import { getWorkspaceForCountry } from '@/lib/constants/bundle-country-mapping';
import {
  bundleToAllocations,
  detectBundleFromAllocations,
} from '@/lib/utils/bundle';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import { BundlePreviewModal } from './bundle-preview-modal';
import { BundleTabPanel } from './bundle-tab-panel';
import { useBundleProjects } from './use-bundle-projects';

type BundleSubTab = Exclude<BundleTabId, 'custom'>;

const BUNDLE_TABS: BundleSubTab[] = ['staff-picks', 'wonder', 'rage', 'love'];
const ALL_TABS: BundleTabId[] = [...BUNDLE_TABS, 'custom'];

const TAB_LABEL_KEYS = {
  'staff-picks': 'tabs.staffPicks.label',
  wonder: 'tabs.wonder.label',
  rage: 'tabs.rage.label',
  love: 'tabs.love.label',
  custom: 'tabs.custom.label',
} as const satisfies Record<BundleTabId, string>;

export function BundleTabs() {
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const { control, setValue } = useFormContext<FundraiserFormValues>();

  const country = useWatch<FundraiserFormValues, 'country'>({
    control,
    name: 'country',
  });
  const projectAllocations = useWatch<
    FundraiserFormValues,
    'projectAllocations'
  >({ control, name: 'projectAllocations' });

  const workspace = getWorkspaceForCountry(country);

  const selectedBundle = useMemo(() => {
    if (!workspace || !projectAllocations) return undefined;
    return detectBundleFromAllocations(projectAllocations, workspace);
  }, [projectAllocations, workspace]);

  const [activeTab, setActiveTab] = useState<BundleTabId>(
    selectedBundle
      ? (selectedBundle.tabs[0] ?? BUNDLE_CONFIG.meta.defaultTab)
      : BUNDLE_CONFIG.meta.defaultTab
  );
  const [previewBundle, setPreviewBundle] = useState<Bundle | null>(null);

  function handleUseBundle(bundle: Bundle) {
    if (!workspace) return;
    setValue('projectAllocations', bundleToAllocations(bundle, workspace), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPreviewBundle(null);
  }

  // Country has no bundle workspace (ES, CH) — Custom only.
  if (!workspace) {
    return (
      <div className='flex flex-col gap-3'>
        <SectionHeader>{t('sectionHeading')}</SectionHeader>
        <div className='rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          {t('custom.comingSoon')}
        </div>
      </div>
    );
  }

  return (
    <BundleTabsContent
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      previewBundle={previewBundle}
      setPreviewBundle={setPreviewBundle}
      selectedBundleSlug={selectedBundle?.slug}
      workspace={workspace}
      onUseBundle={handleUseBundle}
    />
  );
}

interface BundleTabsContentProps {
  activeTab: BundleTabId;
  setActiveTab: (tab: BundleTabId) => void;
  previewBundle: Bundle | null;
  setPreviewBundle: (bundle: Bundle | null) => void;
  selectedBundleSlug: string | undefined;
  workspace: 'DE';
  onUseBundle: (bundle: Bundle) => void;
}

/**
 * Inner component so `useBundleProjects` only runs when a workspace exists.
 * Keeps the hook out of the early-return branch above.
 */
function BundleTabsContent({
  activeTab,
  setActiveTab,
  previewBundle,
  setPreviewBundle,
  selectedBundleSlug,
  workspace,
  onUseBundle,
}: BundleTabsContentProps) {
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const { getProject } = useBundleProjects(workspace);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('sectionHeading')}</SectionHeader>

      <div
        role='tablist'
        aria-label={t('sectionHeading')}
        className='flex h-11 w-full items-center gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted py-1 pl-1 pr-3 shadow-xs md:overflow-x-visible md:pr-1'
      >
        {ALL_TABS.map(tabId => {
          const isSelected = tabId === activeTab;
          return (
            <button
              key={tabId}
              role='tab'
              type='button'
              aria-selected={isSelected}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'inline-flex h-8 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(TAB_LABEL_KEYS[tabId])}
            </button>
          );
        })}
      </div>

      <div role='tabpanel'>
        {activeTab === 'custom' ? (
          <div className='rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
            {t('custom.comingSoon')}
          </div>
        ) : (
          <BundleTabPanel
            tabId={activeTab}
            workspace={workspace}
            selectedBundleSlug={selectedBundleSlug}
            getProject={getProject}
            onSelectBundle={onUseBundle}
            onOpenBundle={setPreviewBundle}
          />
        )}
      </div>

      {previewBundle && (
        <BundlePreviewModal
          bundle={previewBundle}
          workspace={workspace}
          isOpen
          getProject={getProject}
          onClose={() => setPreviewBundle(null)}
          onUseBundle={onUseBundle}
        />
      )}
    </div>
  );
}
