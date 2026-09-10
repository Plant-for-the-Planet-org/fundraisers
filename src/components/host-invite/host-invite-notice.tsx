'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cleanUrl } from '@/lib/utils/auth';
import {
  HOST_INVITE_NOTICE_PARAM,
  isHostInviteNoticeProminent,
  parseHostInviteNotice,
} from '@/lib/utils/host-invite';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Tells someone what happened after they answered a co-host invitation.
 *
 * The accept page redirects here with `?hostInvite=<outcome>`, so this is the first thing the
 * fundraiser page has to say to them. Accepting opens a dialog, because they have just gained
 * something and there is somewhere to go next; the other outcomes are a toast.
 *
 * The parameter is consumed once and then removed from the URL, so a refresh or a shared link does
 * not repeat the message. Anything unrecognised is ignored, and no text ever comes from the URL.
 */
export function HostInviteNotice() {
  const t = useTranslations('HostInvite.notice');
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Captured on the first render and kept, because cleanUrl() below removes the parameter it came
  // from — reading it live would close the dialog the moment the URL is tidied.
  const [notice] = useState(() =>
    parseHostInviteNotice(searchParams.get(HOST_INVITE_NOTICE_PARAM))
  );
  const [isDismissed, setIsDismissed] = useState(false);
  // The effect re-runs when cleanUrl() rewrites the URL, and a toast fired twice reads as a bug.
  const hasHandled = useRef(false);

  useEffect(() => {
    if (!notice || hasHandled.current) return;
    hasHandled.current = true;

    if (!isHostInviteNoticeProminent(notice)) {
      if (notice === 'declined') {
        toast.success(t('declined'));
      } else if (notice === 'already-host') {
        toast.info(t('alreadyHost'));
      } else {
        toast.error(notice === 'expired' ? t('expired') : t('invalid'));
      }
    }

    cleanUrl([HOST_INVITE_NOTICE_PARAM]);
  }, [notice, t]);

  const isDialogOpen =
    notice !== null && isHostInviteNoticeProminent(notice) && !isDismissed;

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => setIsDismissed(true)}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('acceptedTitle')}</DialogTitle>
          <DialogDescription>
            {isAuthenticated ? t('acceptedBody') : t('acceptedBodySignedOut')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-2 sm:gap-2'>
          <Button variant='outline' onClick={() => setIsDismissed(true)}>
            {t('acceptedDismiss')}
          </Button>
          <Button asChild>
            <Link
              href={
                isAuthenticated ? '/dashboard' : '/login?redirectTo=/dashboard'
              }
            >
              {isAuthenticated ? t('acceptedCta') : t('acceptedCtaSignedOut')}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
