'use client';

import type { Fundraiser, FundraiserStatus } from '@/lib/types/fundraiser';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CalendarPlus,
  Link as LinkIcon,
  Loader2,
  Monitor,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteFundraiser,
  pauseFundraiser,
  resumeFundraiser,
} from '@/lib/api/fundraiser-service';
import {
  getFundraiserUrl,
  isFundraiserOwnerOrAdmin,
  isStageModeEnabled,
} from '@/lib/utils/fundraiser';
import { deriveDisplayStatus } from '@/lib/utils/fundraiser-list';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { openStageWindow } from '@/modules/stage';
import { ExtendFundraiserDialog } from './extend-fundraiser-dialog';

interface FundraiserActionMenuProps {
  fundraiser: Fundraiser;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
  onFundraiserRemoved: (id: string) => void;
}

interface ActionVisibility {
  edit: boolean;
  copyLink: boolean;
  pause: boolean;
  resume: boolean;
  stageMode: boolean;
  extend: boolean;
  delete: boolean;
}

const NON_OWNER_ACTIONS: ActionVisibility = {
  edit: false,
  copyLink: true,
  pause: false,
  resume: false,
  stageMode: false,
  extend: false,
  delete: false,
};

// Status drives edit/pause/resume; Stage Mode and Extend are orthogonal (they
// depend on module settings / derived "ending soon" state, not the raw status)
// and are layered on afterwards.
type StatusActions = Omit<ActionVisibility, 'stageMode' | 'extend'>;

const OWNER_ACTIONS_BY_STATUS: Record<FundraiserStatus, StatusActions> = {
  active: {
    edit: true,
    copyLink: true,
    pause: true,
    resume: false,
    delete: true,
  },
  paused: {
    edit: true,
    copyLink: true,
    pause: false,
    resume: true,
    delete: true,
  },
  draft: {
    edit: true,
    copyLink: true,
    pause: false,
    resume: false,
    delete: true,
  },
  completed: {
    edit: false,
    copyLink: true,
    pause: false,
    resume: false,
    delete: true,
  },
  cancelled: {
    edit: false,
    copyLink: true,
    pause: false,
    resume: false,
    delete: true,
  },
  // Archived fundraisers are not returned by the list API, so this is a defensive check.
  archived: {
    edit: false,
    copyLink: true,
    pause: false,
    resume: false,
    delete: false,
  },
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
    // Show "Extend Fundraiser" only for active fundraisers that are ending soon.
    extend: deriveDisplayStatus(fundraiser) === 'ending-soon',
  };
}

type StatusActionKind = 'pause' | 'resume';
type PendingAction = StatusActionKind | 'delete' | null;

export function FundraiserActionMenu({
  fundraiser,
  onFundraiserUpdated,
  onFundraiserRemoved,
}: FundraiserActionMenuProps) {
  const t = useTranslations('Dashboard.actions');
  const tDialog = useTranslations('Dashboard.deleteDialog');
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUserId = useAuthStore(state => state.user?.sub ?? null);

  const [pending, setPending] = useState<PendingAction>(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);

  const actions = getAvailableActions(fundraiser, currentUserId);
  const hasAnyAction =
    actions.edit ||
    actions.copyLink ||
    actions.pause ||
    actions.resume ||
    actions.stageMode ||
    actions.extend ||
    actions.delete;
  const showStatusGroup = actions.pause || actions.resume;
  const showSeparator =
    showStatusGroup && (actions.edit || actions.copyLink || actions.stageMode);

  if (!hasAnyAction) return null;

  const editHref = `/dashboard/fundraisers/edit/${fundraiser.slug}`;

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
        updatedFundraiser = await resumeFundraiser(fundraiser.id, accessToken);
        toast.success(t('resumeSuccess'));
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

  const handleDelete = async () => {
    if (pending || !accessToken) return;

    setPending('delete');
    try {
      // Both 204 and 200 (`status: 'archived'`) indicate a successful delete.
      await deleteFundraiser(fundraiser.id, accessToken);
      toast.success(t('deleteSuccess'));
      // Close first in case the row remains mounted in the future.
      setDeleteDialogOpen(false);
      // Removed from the list because archived fundraisers are never returned.
      onFundraiserRemoved(fundraiser.id);
    } catch (error) {
      // Keep the dialog open so the user can retry.
      console.error('[FundraiserActionMenu] delete failed:', error);
      toast.error(t('mutationError'));
    } finally {
      setPending(null);
    }
  };

  const isMutating = pending !== null;
  const isDeleting = pending === 'delete';

  return (
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
        {/* Place "Extend Fundraiser" at the top for ending-soon fundraisers. */}
        {actions.extend && (
          <>
            <DropdownMenuItem
              className='cursor-pointer rounded-lg py-2'
              disabled={isMutating}
              onSelect={event => {
                event.preventDefault();
                setOpen(false);
                setExtendDialogOpen(true);
              }}
            >
              <CalendarPlus aria-hidden='true' />
              {t('extend')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {actions.edit && (
          <DropdownMenuItem asChild className='cursor-pointer rounded-lg py-2'>
            <Link href={editHref}>
              <Pencil aria-hidden='true' />
              {t('edit')}
            </Link>
          </DropdownMenuItem>
        )}
        {actions.stageMode && (
          <DropdownMenuItem
            className='cursor-pointer rounded-lg py-2'
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
            className='cursor-pointer rounded-lg py-2'
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
            className='cursor-pointer rounded-lg py-2'
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
            className='cursor-pointer rounded-lg py-2 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 dark:text-emerald-400 dark:focus:bg-emerald-950/40 dark:focus:text-emerald-400'
            disabled={isMutating}
            onSelect={event => {
              event.preventDefault();
              void handleStatusChange('resume');
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
            {t('resume')}
          </DropdownMenuItem>
        )}
        {actions.delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer rounded-lg py-2'
              disabled={isMutating}
              onSelect={event => {
                event.preventDefault();
                setOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 aria-hidden='true' />
              {t('delete')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      <ExtendFundraiserDialog
        fundraiser={fundraiser}
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        onFundraiserUpdated={onFundraiserUpdated}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={next => {
          // Don't allow closing mid-request; the button shows a spinner.
          if (isDeleting) return;
          setDeleteDialogOpen(next);
        }}
      >
        <DialogContent className='sm:max-w-md' showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{tDialog('title')}</DialogTitle>
            <DialogDescription>{tDialog('description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='outline' disabled={isDeleting}>
                {tDialog('cancel')}
              </Button>
            </DialogClose>
            <Button
              type='button'
              variant='destructive'
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting && (
                <Loader2 className='animate-spin' aria-hidden='true' />
              )}
              {tDialog('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
