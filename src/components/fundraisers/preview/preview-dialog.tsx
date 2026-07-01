'use client';

import type { ReactNode } from 'react';
import type { FundraiserHost, ProjectAllocation } from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { getFontStack } from '@/lib/theme/font-utils';
import { formValuesToPreviewFundraiser } from '@/lib/utils/form-values-to-preview-fundraiser';
import { useAuthStore } from '@/stores/auth-store';
import { useBundleProjects } from '@/components/fundraisers/bundle-selection/use-bundle-projects';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';
import { ThemeBackdrop } from '@/components/theme/theme-backdrop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { MainContent } from '@/components/ui/main-content';

interface PreviewDialogProps {
  onClose: () => void;
  mode: 'create' | 'edit';
  /** Real hosts (edit mode). Create mode falls back to the current user. */
  existingHosts?: FundraiserHost[];
  /** Mode-appropriate Save CTA (Create/Update), wired by the caller. */
  saveButton: ReactNode;
}

/** Rendered only while open (see PreviewButton), so hooks fetch lazily. */
export function PreviewDialog({
  onClose,
  mode,
  existingHosts,
  saveButton,
}: PreviewDialogProps) {
  const t = useTranslations('Fundraisers');
  const { getValues } = useFormContext<FundraiserFormValues>();
  const user = useAuthStore(state => state.user);

  const values = getValues();
  const { getProject } = useBundleProjects(values.country);

  // Resolve form project_ids to full project details for ProjectsSupported.
  const projectAllocations = useMemo<ProjectAllocation[]>(
    () =>
      values.projectAllocations.map(({ project_id, percentage }) => {
        const project = getProject(project_id);
        return {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            image: project.image ?? '',
            allowDonations: project.allowDonations,
          },
          percentage,
        };
      }),
    [values.projectAllocations, getProject]
  );

  const hosts = useMemo<FundraiserHost[]>(() => {
    if (mode === 'edit') return existingHosts ?? [];
    if (!user) return [];
    // Create mode has no hosts yet — show the current user as a stand-in.
    return [
      {
        id: 'preview-host',
        user: {
          id: user.sub,
          name: user.name ?? '',
          avatar: user.picture ?? null,
        },
        hostType: 'user',
        role: 'admin',
        isPublic: true,
        displayName: null,
        displayOrder: 0,
        status: 'active',
        invitedEmail: null,
      },
    ];
  }, [mode, existingHosts, user]);

  const fundraiser = useMemo(
    () => formValuesToPreviewFundraiser(values, { projectAllocations, hosts }),
    [values, projectAllocations, hosts]
  );

  const theme = useMemo(
    () => buildTheme(fundraiser.settings?.theme ?? null),
    [fundraiser.settings?.theme]
  );

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className='max-w-none sm:max-w-none w-screen h-screen top-0 left-0 translate-x-0 translate-y-0 rounded-none border-0 p-0 gap-0'
      >
        <DialogTitle className='sr-only'>{t('preview.title')}</DialogTitle>
        <div
          className={`theme-${theme.id} ${theme.mode} relative flex flex-col h-screen overflow-y-auto`}
          data-theme={theme.id}
          style={
            {
              fontFamily: getFontStack(theme.bodyFont),
              '--theme-title-font': getFontStack(theme.titleFont),
              '--accent-color': getAccentColor(theme.accent),
            } as React.CSSProperties
          }
        >
          <ThemeBackdrop theme={theme} />

          {/* Preview banner */}
          <div className='relative z-10 bg-amber-100 text-amber-900 border-b border-amber-200 px-4 py-3 text-center text-sm font-medium'>
            <p className='font-semibold'>{t('preview.bannerTitle')}</p>
            <p>{t('preview.bannerDescription')}</p>
          </div>

          <div className='relative z-10 flex-1'>
            <MainContent>
              <FundraiserView
                fundraiser={fundraiser}
                preview
                leaderboardFetchStrategy='client'
                previewActions={
                  <>
                    <DialogClose asChild>
                      <Button variant='outline'>{t('preview.close')}</Button>
                    </DialogClose>
                    {saveButton}
                  </>
                }
              />
            </MainContent>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
