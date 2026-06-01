'use client';

import type {
  Bundle,
  BundleSlug,
  BundleTabId,
  BundleWorkspace,
} from '@/lib/types/bundle';
import type { AllowedCountry } from '@/lib/utils/country-currency';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import { BUNDLE_CONFIG } from '@/lib/constants/bundle-config';
import { getWorkspaceForCountry } from '@/lib/constants/bundle-country-mapping';
import { BUNDLE_TAB_IDS } from '@/lib/types/bundle';
import { bundleToAllocations, getBundleBySlug } from '@/lib/utils/bundle';
import { cn } from '@/lib/utils/cn';
import { getDefaultCauseId } from '@/lib/utils/project-allocation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '../typography';
import { BundlePreviewModal } from './bundle-preview-modal';
import { BundleTabPanel } from './bundle-tab-panel';
import { CustomTabPanel } from './custom-tab-panel';
import { useBundleProjects } from './use-bundle-projects';

const MOBILE_VISIBLE: BundleTabId[] = ['staff-picks'];
const MOBILE_HIDDEN: BundleTabId[] = BUNDLE_TAB_IDS.filter(
  id => !MOBILE_VISIBLE.includes(id)
);

interface BundleSelectionProps {
  mode: 'create' | 'edit';
}

function getInitialActiveTab({
  bundleWorkspace,
  selectedBundle,
  mode,
}: {
  bundleWorkspace: BundleWorkspace | null;
  selectedBundle: Bundle | undefined;
  mode: BundleSelectionProps['mode'];
}): BundleTabId {
  // Workspace without bundles (ES, CH) → only Custom is shown.
  if (!bundleWorkspace) {
    return 'custom';
  }

  // Derive the tab from the config's tab list rather than Bundle.tabs[].
  if (selectedBundle) {
    const tab = BUNDLE_CONFIG.tabs.find(t =>
      t.bundleSlugs.includes(selectedBundle.slug)
    );
    return tab?.id ?? BUNDLE_CONFIG.meta.defaultTab;
  }

  // Edit mode without a stored bundle slug → custom selection.
  if (mode === 'edit') {
    return 'custom';
  }

  return BUNDLE_CONFIG.meta.defaultTab;
}

export function BundleSelection({ mode }: BundleSelectionProps) {
  const t = useTranslations('Bundles');
  const { control, setValue } = useFormContext<FundraiserFormValues>();

  const country = useWatch<FundraiserFormValues, 'country'>({
    control,
    name: 'country',
  });
  const bundleSlug = useWatch<
    FundraiserFormValues,
    'settings.modules.bundle.slug'
  >({ control, name: 'settings.modules.bundle.slug' });

  const bundleWorkspace = getWorkspaceForCountry(country);

  const selectedBundle = bundleWorkspace
    ? getBundleBySlug(bundleSlug)
    : undefined;

  const [activeTab, setActiveTab] = useState<BundleTabId>(() =>
    getInitialActiveTab({ bundleWorkspace, selectedBundle, mode })
  );
  const [previewBundle, setPreviewBundle] = useState<Bundle | null>(null);

  function handleUseBundle(bundle: Bundle) {
    if (!bundleWorkspace) return;
    setValue(
      'projectAllocations',
      bundleToAllocations(bundle, bundleWorkspace),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
    setValue('settings.modules.bundle.slug', bundle.slug, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPreviewBundle(null);
  }

  const handleTabChange = useCallback(
    (nextTab: BundleTabId) => {
      // When switching INTO Custom from a bundle tab, drop the prefilled bundle
      // selection so the user starts fresh with only the support project.
      if (nextTab === 'custom' && activeTab !== 'custom') {
        if (selectedBundle) {
          const supportId = getDefaultCauseId(country);
          setValue(
            'projectAllocations',
            [{ project_id: supportId, percentage: 100 }],
            { shouldDirty: true, shouldValidate: true }
          );
        }
        setValue('settings.modules.bundle.slug', null, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      setActiveTab(nextTab);
    },
    [activeTab, selectedBundle, country, setValue]
  );

  // Country has no bundle workspace (ES, CH) — Custom only.
  if (!bundleWorkspace) {
    return (
      <div className='flex flex-col gap-3'>
        <SectionHeader>{t('sectionHeading')}</SectionHeader>
        <CustomTabPanel country={country} />
      </div>
    );
  }

  return (
    <BundleSelectionContent
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      previewBundle={previewBundle}
      setPreviewBundle={setPreviewBundle}
      selectedBundleSlug={selectedBundle?.slug}
      country={country}
      bundleWorkspace={bundleWorkspace}
      onUseBundle={handleUseBundle}
    />
  );
}

interface BundleSelectionContentProps {
  activeTab: BundleTabId;
  setActiveTab: (tab: BundleTabId) => void;
  previewBundle: Bundle | null;
  setPreviewBundle: (bundle: Bundle | null) => void;
  selectedBundleSlug: BundleSlug | undefined;
  country: AllowedCountry;
  bundleWorkspace: BundleWorkspace;
  onUseBundle: (bundle: Bundle) => void;
}

/**
 * Inner component so `useBundleProjects` only runs when a workspace exists.
 * Keeps the hook out of the early-return branch above.
 */
function BundleSelectionContent({
  activeTab,
  setActiveTab,
  previewBundle,
  setPreviewBundle,
  selectedBundleSlug,
  country,
  bundleWorkspace,
  onUseBundle,
}: BundleSelectionContentProps) {
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

  const handleValueChange = (value: string) => {
    setActiveTab(value as BundleTabId);
    setMoreOpen(false);
  };

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('sectionHeading')}</SectionHeader>

      <Tabs value={activeTab} onValueChange={handleValueChange}>
        {/* Desktop: all tabs */}
        <TabsList
          aria-label={t('sectionHeading')}
          className='hidden w-full gap-1 md:inline-flex'
        >
          {BUNDLE_TAB_IDS.map(tabId => (
            <TabsTrigger key={tabId} value={tabId}>
              {t(`tabs.${tabId}.label`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Mobile: visible tabs + More dropdown (overlays content below).
            Outer pill mimics TabsList's bg so the inner TabsList + sibling
            "More" button still read as a single segmented control. */}
        <div ref={moreRef} className='relative flex flex-col gap-2 md:hidden'>
          <div className='flex h-9 w-full items-center gap-1 rounded-lg bg-muted p-0.75 text-muted-foreground'>
            <TabsList
              aria-label={t('sectionHeading')}
              className='h-full! w-auto basis-[70%] rounded-none bg-transparent p-0'
            >
              {MOBILE_VISIBLE.map(tabId => (
                <TabsTrigger key={tabId} value={tabId}>
                  {t(`tabs.${tabId}.label`)}
                </TabsTrigger>
              ))}
            </TabsList>

            <button
              type='button'
              onClick={() => setMoreOpen(v => !v)}
              aria-expanded={moreOpen}
              className={cn(
                'inline-flex h-[calc(100%-1px)] basis-[30%] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                moreIsActive && 'bg-background text-foreground shadow-sm'
              )}
            >
              <span>
                {moreIsActive ? t(`tabs.${activeTab}.label`) : t('moreLabel')}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  moreOpen && 'rotate-180'
                )}
              />
            </button>
          </div>

          {moreOpen && (
            <div className='absolute right-0 top-full z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-background shadow-lg'>
              {MOBILE_HIDDEN.map(tabId => {
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    type='button'
                    onClick={() => handleValueChange(tabId)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-3 text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                      isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <span className='flex h-4 w-4 items-center justify-center'>
                      {isActive && (
                        <Check
                          className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
                          aria-hidden='true'
                        />
                      )}
                    </span>
                    <span>{t(`tabs.${tabId}.label`)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <TabsContent value={activeTab}>
          {activeTab === 'custom' ? (
            <CustomTabPanel country={country} />
          ) : (
            <BundleTabPanel
              activeTab={activeTab}
              bundleWorkspace={bundleWorkspace}
              selectedBundleSlug={selectedBundleSlug}
              getProject={getProject}
              onSelectBundle={onUseBundle}
              onOpenBundle={setPreviewBundle}
            />
          )}
        </TabsContent>
      </Tabs>

      {previewBundle && activeTab !== 'custom' && (
        <BundlePreviewModal
          bundle={previewBundle}
          activeTab={activeTab}
          bundleWorkspace={bundleWorkspace}
          isOpen
          getProject={getProject}
          onClose={() => setPreviewBundle(null)}
          onUseBundle={onUseBundle}
        />
      )}
    </div>
  );
}
