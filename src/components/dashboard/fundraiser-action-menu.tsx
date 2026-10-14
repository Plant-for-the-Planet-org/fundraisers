'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Copy,
  Loader2,
  Monitor,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Rocket,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteFundraiser,
  pauseFundraiser,
  publishFundraiser,
  resumeFundraiser,
} from '@/lib/api/fundraiser-service';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
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
import { ArrowUpRightFromSquareIcon, LinkIcon } from '@/components/ui/ui-icons';
import { openStageWindow } from '@/modules/stage';
import { CloneFundraiserDialog } from './clone-fundraiser-dialog';
import { getAvailableActions } from './fundraiser-actions';

interface FundraiserActionMenuProps {
  fundraiser: Fundraiser;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
  onFundraiserRemoved: (id: string) => void;
}

type StatusActionKind = 'pause' | 'resume';
type PendingAction = StatusActionKind | 'publish' | 'delete' | null;

export function FundraiserActionMenu({
  fundraiser,
  onFundraiserUpdated,
  onFundraiserRemoved,
}: FundraiserActionMenuProps) {
  const t = useTranslations('Dashboard.actions');
  const tDialog = useTranslations('Dashboard.deleteDialog');
  const tLive = useTranslations('Dashboard.goLiveDialog');
  const router = useRouter();
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUserId = useAuthStore(state => state.user?.sub ?? null);

  const [pending, setPending] = useState<PendingAction>(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goLiveDialogOpen, setGoLiveDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);

  const actions = getAvailableActions(fundraiser, currentUserId);
  const hasAnyAction =
    actions.publish ||
    actions.edit ||
    actions.clone ||
    actions.copyLink ||
    actions.pause ||
    actions.resume ||
    actions.stageMode ||
    actions.delete;
  const showStatusGroup = actions.pause || actions.resume;
  const showSeparator =
    showStatusGroup &&
    (actions.edit || actions.clone || actions.copyLink || actions.stageMode);

  if (!hasAnyAction) return null;

  const editHref = `/dashboard/fundraisers/edit/${fundraiser.slug}`;

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

  const handlePublish = async () => {
    if (pending || !accessToken) return;

    setPending('publish');
    try {
      const updatedFundraiser = await publishFundraiser(
        fundraiser.id,
        accessToken
      );
      toast.success(t('publishSuccess'));
      setGoLiveDialogOpen(false);
      onFundraiserUpdated(updatedFundraiser);
    } catch (error) {
      // The platform may refuse a draft that is not complete. Keep the dialog open, and point to the editor.
      console.error('[FundraiserActionMenu] publish failed:', error);
      toast.error(t('publishErrorTitle'), {
        description: t('publishErrorDescription'),
        action: { label: t('edit'), onClick: () => router.push(editHref) },
      });
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
  const isPublishing = pending === 'publish';

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
        {actions.publish && (
          <>
            <DropdownMenuItem
              className='cursor-pointer rounded-lg py-2 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 dark:text-emerald-400 dark:focus:bg-emerald-950/40 dark:focus:text-emerald-400'
              disabled={isMutating}
              onSelect={event => {
                event.preventDefault();
                setOpen(false);
                setGoLiveDialogOpen(true);
              }}
            >
              <Rocket
                className='text-emerald-600 dark:text-emerald-400'
                aria-hidden='true'
              />
              {t('publish')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild className='cursor-pointer rounded-lg py-2'>
          <a
            href={getFundraiserUrl(fundraiser)}
            target='_blank'
            rel='noopener noreferrer'
          >
            <ArrowUpRightFromSquareIcon />
            {t('viewPage')}
          </a>
        </DropdownMenuItem>

        {actions.edit && (
          <DropdownMenuItem asChild className='cursor-pointer rounded-lg py-2'>
            <Link href={editHref}>
              <Pencil aria-hidden='true' />
              {t('edit')}
            </Link>
          </DropdownMenuItem>
        )}

        {actions.clone && (
          <DropdownMenuItem
            className='cursor-pointer rounded-lg py-2'
            onSelect={event => {
              event.preventDefault();
              setOpen(false);
              setCloneDialogOpen(true);
            }}
          >
            <Copy aria-hidden='true' />
            {t('clone')}
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
          <DropdownMenuItem asChild className='cursor-pointer rounded-lg py-2'>
            <Link
              href={`/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/share`}
            >
              <LinkIcon />
              {t('share')}
            </Link>
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

      <CloneFundraiserDialog
        fundraiser={fundraiser}
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
      />

      <Dialog
        open={goLiveDialogOpen}
        onOpenChange={next => {
          // Don't allow closing mid-request; the button shows a spinner.
          if (isPublishing) return;
          setGoLiveDialogOpen(next);
        }}
      >
        <DialogContent className='sm:max-w-md' showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{tLive('title')}</DialogTitle>
            <DialogDescription>{tLive('description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='outline' disabled={isPublishing}>
                {tLive('cancel')}
              </Button>
            </DialogClose>
            <Button
              type='button'
              disabled={isPublishing}
              onClick={() => void handlePublish()}
            >
              {isPublishing && (
                <Loader2 className='animate-spin' aria-hidden='true' />
              )}
              {tLive('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
