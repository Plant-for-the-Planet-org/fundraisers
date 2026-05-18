'use client';

import type {
  Bundle,
  BundleSlug,
  BundleTabId,
  BundleWorkspace,
} from '@/lib/types/bundle';
import type { AllowedCountry } from '@/lib/utils/country-currency';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { BUNDLE_CONFIG } from '@/lib/constants/bundle-config';
import { getWorkspaceForCountry } from '@/lib/constants/bundle-country-mapping';
import { BUNDLE_TAB_IDS } from '@/lib/types/bundle';
import {
  bundleToAllocations,
  detectBundleFromAllocations,
} from '@/lib/utils/bundle';
import { cn } from '@/lib/utils/cn';
import { getDefaultCauseId } from '@/lib/utils/project-selection';
import { SectionHeader } from '../typography';
import { BundlePreviewModal } from './bundle-preview-modal';
import { BundleTabPanel } from './bundle-tab-panel';
import { CustomTabPanel } from './custom-tab-panel';
import { useBundleProjects } from './use-bundle-projects';

const MOBILE_VISIBLE: BundleTabId[] = ['staff-picks'];
const MOBILE_HIDDEN: BundleTabId[] = BUNDLE_TAB_IDS.filter(
  id => !MOBILE_VISIBLE.includes(id)
);

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

  const handleTabChange = useCallback(
    (nextTab: BundleTabId) => {
      // When switching INTO Custom from a bundle tab, drop the prefilled bundle
      // selection so the user starts fresh with only the support project.
      if (nextTab === 'custom' && activeTab !== 'custom' && selectedBundle) {
        const supportId = getDefaultCauseId(country);
        setValue(
          'projectAllocations',
          [{ project_id: supportId, percentage: 100 }],
          { shouldDirty: true, shouldValidate: true }
        );
      }
      setActiveTab(nextTab);
    },
    [activeTab, selectedBundle, country, setValue]
  );

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
      setActiveTab={handleTabChange}
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
  selectedBundleSlug: BundleSlug | undefined;
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  const moreIsActive = MOBILE_HIDDEN.includes(activeTab);

  function renderTab(tabId: BundleTabId) {
    const isSelected = tabId === activeTab;
    return (
      <button
        key={tabId}
        role='tab'
        type='button'
        aria-selected={isSelected}
        onClick={() => {
          setActiveTab(tabId);
          setMoreOpen(false);
        }}
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
  }

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('sectionHeading')}</SectionHeader>

      {/* Desktop: all tabs */}
      <div
        role='tablist'
        aria-label={t('sectionHeading')}
        className='hidden md:flex h-11 w-full items-center gap-1 rounded-xl border border-border/60 bg-muted/50 py-1 pl-1 pr-1 shadow-xs'
      >
        {BUNDLE_TAB_IDS.map(tabId => renderTab(tabId))}
      </div>

      {/* Mobile: 3 visible + more dropdown */}
      <div className='md:hidden'>
        <div
          role='tablist'
          aria-label={t('sectionHeading')}
          className='flex h-11 w-full items-center gap-1 rounded-xl border border-border/60 bg-muted/50 py-1 pl-1 pr-1 shadow-xs'
        >
          {MOBILE_VISIBLE.map(tabId => renderTab(tabId))}

          <div ref={moreRef} className='relative'>
            <button
              type='button'
              onClick={() => setMoreOpen(v => !v)}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors',
                moreIsActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>
                {moreIsActive ? t(`tabs.${activeTab}.label`) : 'More'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  moreOpen && 'rotate-180'
                )}
              />
            </button>

            {moreOpen && (
              <div className='absolute right-0 top-full z-50 mt-1 min-w-32 overflow-hidden rounded-lg border border-border bg-background shadow-md'>
                {MOBILE_HIDDEN.map(tabId => (
                  <button
                    key={tabId}
                    type='button'
                    onClick={() => {
                      setActiveTab(tabId);
                      setMoreOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted',
                      activeTab === tabId
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {t(`tabs.${tabId}.label`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div role='tabpanel'>
        {activeTab === 'custom' ? (
          <CustomTabPanel country={country} />
        ) : (
          <BundleTabPanel
            activeTab={activeTab}
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
