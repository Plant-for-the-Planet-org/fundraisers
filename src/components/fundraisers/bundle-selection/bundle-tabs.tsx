'use client';

import type { Bundle, BundleTabId, BundleWorkspace } from '@/lib/types/bundle';
import type { AllowedCountry } from '@/lib/utils/country-currency';
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
import { CustomTabPanel } from './custom-tab-panel';
import { useBundleProjects } from './use-bundle-projects';

type BundleSubTab = Exclude<BundleTabId, 'custom'>;

const BUNDLE_TABS: BundleSubTab[] = ['staff-picks', 'wonder', 'rage', 'love'];
const ALL_TABS: BundleTabId[] = [...BUNDLE_TABS, 'custom'];

interface BundleTabsProps {
  mode: 'create' | 'edit';
}

export function BundleTabs({ mode }: BundleTabsProps) {
  const t = useTranslations('Bundles');
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

  const [activeTab, setActiveTab] = useState<BundleTabId>(() => {
    if (selectedBundle) {
      return selectedBundle.tabs[0] ?? BUNDLE_CONFIG.meta.defaultTab;
    }
    // Edit mode with no bundle match → user has a custom selection; land on Custom.
    if (mode === 'edit') return 'custom';
    return BUNDLE_CONFIG.meta.defaultTab;
  });
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
        <CustomTabPanel country={country} />
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
      country={country}
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
  country: AllowedCountry;
  workspace: BundleWorkspace;
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
  country,
  workspace,
  onUseBundle,
}: BundleTabsContentProps) {
  const t = useTranslations('Bundles');
  const { getProject } = useBundleProjects(country);

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
              {t(`tabs.${tabId}.label`)}
            </button>
          );
        })}
      </div>

      <div role='tabpanel'>
        {activeTab === 'custom' ? (
          <CustomTabPanel country={country} />
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

      {previewBundle && activeTab !== 'custom' && (
        <BundlePreviewModal
          bundle={previewBundle}
          activeTab={activeTab}
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
