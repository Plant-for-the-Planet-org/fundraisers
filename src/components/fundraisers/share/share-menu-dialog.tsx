'use client';

import type { ShareData } from '@/lib/share/build-share-data';

import { useTranslations } from 'next-intl';
import { SHARE_TARGETS } from '@/lib/share/targets';
import { CopyLinkButton } from '@/components/fundraisers/copy-link-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShareMenuDialogProps {
  data: ShareData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fallback share surface, shown when native Web Share is unavailable.
 *
 * Renders Copy link plus every entry in {@link SHARE_TARGETS}, so platform
 * branches extend the menu by registering a target — no edits here.
 */
export function ShareMenuDialog({
  data,
  open,
  onOpenChange,
}: ShareMenuDialogProps) {
  const t = useTranslations('Fundraisers.share');
  const tTargets = useTranslations('Fundraisers.share.targets');

  const targets = SHARE_TARGETS.filter(
    target => target.isAvailable?.(data) ?? true
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2'>
          <CopyLinkButton url={data.url} />

          {targets.map(target => {
            const Icon = target.icon;
            return (
              <Button
                key={target.id}
                variant='outline'
                className='w-max border-border bg-white hover:bg-gray-50'
                onClick={() => void target.run(data)}
              >
                <Icon className='size-4' aria-hidden='true' />
                {tTargets(target.labelKey)}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
