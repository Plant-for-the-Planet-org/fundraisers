'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createFundraiser } from '@/lib/api/create-fundraiser-service';
import { TITLE_MAX_LENGTH } from '@/lib/constants/fundraiser-creation';
import { buildCloneFundraiserRequest } from '@/lib/utils/fundraiser-data-builder';
import { fetchImageAsBase64 } from '@/lib/utils/image-processor';
import { resolveFundraiserImageSource } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraisersStore } from '@/stores/hosted-fundraisers-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CloneFundraiserDialogProps {
  fundraiser: Fundraiser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneFundraiserDialog({
  fundraiser,
  open,
  onOpenChange,
}: CloneFundraiserDialogProps) {
  const t = useTranslations('Dashboard.cloneDialog');
  const router = useRouter();
  const accessToken = useAuthStore(state => state.accessToken);

  // `null` means untouched, so the field shows the source title until the host
  // types. Clearing the draft on close is what makes the next open start fresh.
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const title = titleDraft ?? fundraiser.title;
  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !isCloning;

  const close = () => {
    setTitleDraft(null);
    onOpenChange(false);
  };

  const handleClone = async () => {
    if (!canSubmit || !accessToken) return;

    setIsCloning(true);
    try {
      // The API stores images by filename but only accepts them as base64, so
      // the copy gets its own upload. It is independent from then on: replacing
      // the original's image leaves the copy untouched.
      const imageUrl = resolveFundraiserImageSource(
        fundraiser.image,
        'original'
      );
      const imageFile = imageUrl
        ? await fetchImageAsBase64(imageUrl)
        : undefined;

      const clone = await createFundraiser(
        buildCloneFundraiserRequest(fundraiser, trimmedTitle, imageFile),
        accessToken
      );
      if (!clone.slug) {
        throw new Error('Invalid response from server - missing slug');
      }

      // Drop the hosted-fundraisers cache: the user now owns a fundraiser it
      // does not know about, so its public-page edit shortcut would stay hidden
      // until the cache refetches.
      useHostedFundraisersStore.getState().reset();
      toast.success(t('success'));
      if (imageUrl && !imageFile) {
        toast.warning(t('imageWarning'));
      }

      close();
      router.push(`/dashboard/fundraisers/edit/${clone.slug}`);
    } catch (error) {
      console.error('[CloneFundraiserDialog] clone failed:', error);
      toast.error(t('error'));
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        // Don't allow closing mid-request; the button shows a spinner.
        if (isCloning) return;
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className='sm:max-w-md' showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='clone-fundraiser-title'>{t('titleLabel')}</Label>
          <Input
            id='clone-fundraiser-title'
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            disabled={isCloning}
            onChange={event => setTitleDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleClone();
              }
            }}
          />
          <p className='text-xs text-muted-foreground'>{t('titleHelp')}</p>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={isCloning}
            onClick={close}
          >
            {t('cancel')}
          </Button>
          <Button
            type='button'
            disabled={!canSubmit}
            onClick={() => void handleClone()}
          >
            {isCloning && (
              <Loader2 className='animate-spin' aria-hidden='true' />
            )}
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
