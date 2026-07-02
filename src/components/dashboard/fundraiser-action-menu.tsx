'use client';

import type { Fundraiser, FundraiserStatus } from '@/lib/types/fundraiser';

import { useState } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Link as LinkIcon,
  Loader2,
  Monitor,
  MoreVertical,
  Pause,
  Pencil,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  pauseFundraiser,
  resumeFundraiser,
} from '@/lib/api/fundraiser-service';
import {
  getFundraiserUrl,
  hasFundraiserEnded,
  isFundraiserOwnerOrAdmin,
  isStageModeEnabled,
} from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { openStageWindow } from '@/modules/stage';

interface FundraiserActionMenuProps {
  fundraiser: Fundraiser;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
}

interface ActionVisibility {
  edit: boolean;
  copyLink: boolean;
  pause: boolean;
  resume: boolean;
  stageMode: boolean;
}

const NON_OWNER_ACTIONS: ActionVisibility = {
  edit: false,
  copyLink: true,
  pause: false,
  resume: false,
  stageMode: false,
};

// Status drives edit/pause/resume; Stage Mode is orthogonal (it depends on the
// fundraiser's module settings, not its status) and is layered on afterwards.
type StatusActions = Omit<ActionVisibility, 'stageMode'>;

const OWNER_ACTIONS_BY_STATUS: Record<FundraiserStatus, StatusActions> = {
  active: { edit: true, copyLink: true, pause: true, resume: false },
  paused: { edit: true, copyLink: true, pause: false, resume: true },
  draft: { edit: true, copyLink: true, pause: false, resume: true },
  // Completed fundraisers stay editable by owners/admins and can be reactivated
  // (resumed back to active); only pause is withheld until they are active again.
  completed: { edit: true, copyLink: true, pause: false, resume: true },
  // Cancelled fundraisers are locked: cancellation is a Plant-for-the-Planet
  // action, so hosts cannot edit them.
  cancelled: { edit: false, copyLink: true, pause: false, resume: false },
};

function getAvailableActions(
  fundraiser: Fundraiser,
  currentUserId: string | null
): ActionVisibility {
  if (!isFundraiserOwnerOrAdmin(fundraiser, currentUserId)) {
    return NON_OWNER_ACTIONS;
  }
  return {
    ...OWNER_ACTIONS_BY_STATUS[fundraiser.status],
    stageMode: isStageModeEnabled(fundraiser),
  };
}

type StatusActionKind = 'pause' | 'resume';
type PendingAction = StatusActionKind | null;

export function FundraiserActionMenu({
  fundraiser,
  onFundraiserUpdated,
}: FundraiserActionMenuProps) {
  const t = useTranslations('Dashboard.actions');
  const format = useFormatter();
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUserId = useAuthStore(state => state.user?.sub ?? null);

  const [pending, setPending] = useState<PendingAction>(null);
  const [open, setOpen] = useState(false);
  const [showEndedConfirm, setShowEndedConfirm] = useState(false);

  const actions = getAvailableActions(fundraiser, currentUserId);
  const hasAnyAction =
    actions.edit ||
    actions.copyLink ||
    actions.pause ||
    actions.resume ||
    actions.stageMode;
  const showStatusGroup = actions.pause || actions.resume;
  const showSeparator =
    showStatusGroup && (actions.edit || actions.copyLink || actions.stageMode);

  if (!hasAnyAction) return null;

  const editHref = `/dashboard/fundraisers/edit/${fundraiser.slug}`;

  const endDate = new Date(fundraiser.endDate);

  const handleCopyLink = async () => {
    const path = getFundraiserUrl(fundraiser);
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('copyLinkSuccess'));
    } catch {
      toast.error(t('copyLinkError'));
    }
  };

  const handleStatusChange = async (action: StatusActionKind) => {
    if (pending || !accessToken) return;

    setPending(action);
    try {
      let updatedFundraiser: Fundraiser;
      if (action === 'pause') {
        updatedFundraiser = await pauseFundraiser(fundraiser.id, accessToken);
        toast.success(t('pauseSuccess'));
      } else {
        const isDraft = fundraiser.status === 'draft';
        updatedFundraiser = await resumeFundraiser(fundraiser.id, accessToken);
        toast.success(t(isDraft ? 'activateSuccess' : 'resumeSuccess'));
      }
      onFundraiserUpdated(updatedFundraiser);
      setOpen(false);
    } catch (error) {
      console.error('[FundraiserActionMenu] status change failed:', error);
      toast.error(t('mutationError'));
    } finally {
      setPending(null);
    }
  };

  const isMutating = pending !== null;

  return (
    <>
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 self-start rounded-full shrink-0 text-muted-foreground hover:text-foreground'
            aria-label={t('menuLabel')}
            disabled={isMutating}
          >
            <MoreVertical className='h-4 w-4' aria-hidden='true' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-52 rounded-xl border-border/60 shadow-lg'
        >
          {actions.edit && (
            <DropdownMenuItem asChild className='cursor-pointer py-2'>
              <Link href={editHref}>
                <Pencil aria-hidden='true' />
                {t('edit')}
              </Link>
            </DropdownMenuItem>
          )}

          {actions.stageMode && (
            <DropdownMenuItem
              className='cursor-pointer py-2'
              onSelect={() => {
                if (!openStageWindow(fundraiser)) {
                  toast.error(t('stageModeBlocked'));
                }
              }}
            >
              <Monitor aria-hidden='true' />
              {t('stageMode')}
            </DropdownMenuItem>
          )}

          {actions.copyLink && (
            <DropdownMenuItem
              className='cursor-pointer py-2'
              onSelect={handleCopyLink}
            >
              <LinkIcon aria-hidden='true' />
              {t('copyLink')}
            </DropdownMenuItem>
          )}

          {showSeparator && <DropdownMenuSeparator />}

          {actions.pause && (
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer py-2'
              disabled={isMutating}
              onSelect={event => {
                event.preventDefault();
                void handleStatusChange('pause');
              }}
            >
              {pending === 'pause' ? (
                <Loader2 className='animate-spin' aria-hidden='true' />
              ) : (
                <Pause aria-hidden='true' />
              )}
              {t('pause')}
            </DropdownMenuItem>
          )}

          {actions.resume && (
            <DropdownMenuItem
              className='cursor-pointer py-2 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 dark:text-emerald-400 dark:focus:bg-emerald-950/40 dark:focus:text-emerald-400'
              disabled={isMutating}
              onSelect={event => {
                event.preventDefault();
                // Reactivating a fundraiser whose end date is already in the
                // past re-enables donations on an expired campaign, so confirm
                // first.
                if (hasFundraiserEnded(fundraiser)) {
                  setOpen(false);
                  setShowEndedConfirm(true);
                } else {
                  void handleStatusChange('resume');
                }
              }}
            >
              {pending === 'resume' ? (
                <Loader2
                  className='animate-spin text-emerald-600 dark:text-emerald-400'
                  aria-hidden='true'
                />
              ) : (
                <Play
                  className='text-emerald-600 dark:text-emerald-400'
                  aria-hidden='true'
                />
              )}
              {fundraiser.status === 'draft' ? t('activate') : t('resume')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showEndedConfirm} onOpenChange={setShowEndedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reactivateEndedTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reactivateEndedDescription', {
                date: format.dateTime(endDate, { dateStyle: 'long' }),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant='default'>
              {t('reactivateEndedCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='outline'
              onClick={() => void handleStatusChange('resume')}
            >
              {t('reactivateEndedConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
