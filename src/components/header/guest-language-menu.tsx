'use client';

import type { LanguageHintStrings } from './language-hint';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { GlobeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageDialog } from './language-dialog';
import { LanguageHint, nativeName } from './language-hint';

/** The signed-out language button. Signed in, the same dialog opens from the avatar menu. */
export function GuestLanguageMenu({
  hints,
}: {
  hints: Record<string, LanguageHintStrings>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations('Common');

  return (
    <>
      <LanguageHint hints={hints} menuOpen={dialogOpen}>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setDialogOpen(true)}
          aria-label={`${t('languageMenu.label')}: ${nativeName(locale)}`}
          className='rounded-full text-muted-foreground hover:text-foreground'
        >
          <GlobeIcon className='size-5' aria-hidden='true' />
        </Button>
      </LanguageHint>
      <LanguageDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
