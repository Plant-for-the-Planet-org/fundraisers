'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Link as LinkIcon,
  Loader2,
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
import { getFundraiserUrl, isFundraiserOwner } from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FundraiserActionMenuProps {
  fundraiser: Fundraiser;
  onMutate: () => void;
}

interface ActionVisibility {
  edit: boolean;
  copyLink: boolean;
  pause: boolean;
  resume: boolean;
}

function getAvailableActions(
  fundraiser: Fundraiser,
  currentUserId: string | null
): ActionVisibility {
  if (!isFundraiserOwner(fundraiser, currentUserId)) {
    return { edit: false, copyLink: true, pause: false, resume: false };
  }

  switch (fundraiser.status) {
    case 'active':
      return { edit: true, copyLink: true, pause: true, resume: false };
    case 'paused':
    case 'draft':
      return { edit: true, copyLink: true, pause: false, resume: true };
    case 'completed':
    case 'cancelled':
      return { edit: false, copyLink: true, pause: false, resume: false };
    default:
      return { edit: false, copyLink: false, pause: false, resume: false };
  }
}

type PendingAction = 'pause' | 'resume' | null;

export function FundraiserActionMenu({
  fundraiser,
  onMutate,
}: FundraiserActionMenuProps) {
  const t = useTranslations('Dashboard.actions');
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUserId = useAuthStore(state => state.user?.sub ?? null);

  const [pending, setPending] = useState<PendingAction>(null);
  const [open, setOpen] = useState(false);

  const actions = getAvailableActions(fundraiser, currentUserId);
  const hasAnyAction =
    actions.edit || actions.copyLink || actions.pause || actions.resume;
  const showStatusGroup = actions.pause || actions.resume;
  const showSeparator = showStatusGroup && (actions.edit || actions.copyLink);

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

  const handleStatusChange = async (next: 'pause' | 'resume') => {
    if (pending || !accessToken) return;

    setPending(next);
    try {
      if (next === 'pause') {
        await pauseFundraiser(fundraiser.id, accessToken);
        toast.success(t('pauseSuccess'));
      } else {
        await resumeFundraiser(fundraiser.id, accessToken);
        toast.success(t('resumeSuccess'));
      }
      onMutate();
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
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground'
          aria-label={t('menuLabel')}
          disabled={isMutating}
        >
          <MoreVertical className='h-4 w-4' aria-hidden='true' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        className='w-52 border-border/60 shadow-lg'
      >
        {actions.edit && (
          <DropdownMenuItem asChild className='cursor-pointer py-2'>
            <Link href={editHref}>
              <Pencil aria-hidden='true' />
              {t('edit')}
            </Link>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
