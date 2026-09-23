'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { routing } from '@/i18n/routing';
import { nativeName, useChooseLocale } from './language-hint';

/** A language's name in English, e.g. "German", as a fallback for visitors who can't read the page's language. */
function englishName(locale: string): string {
  return (
    new Intl.DisplayNames(['en'], { type: 'language' }).of(locale) ?? locale
  );
}

/** Lists every language by its own name. Picking one switches right away. */
export function LanguageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('Common');
  const choose = useChooseLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('languageMenu.label')}</DialogTitle>
        </DialogHeader>
        <ul className='-mx-2 flex flex-col gap-1'>
          {routing.locales.map(l => {
            const isCurrent = l === locale;
            const native = nativeName(l);
            const english = englishName(l);
            return (
              <li key={l}>
                <button
                  type='button'
                  lang={l}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => {
                    if (isCurrent) {
                      onOpenChange(false);
                    } else {
                      choose(l);
                    }
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent',
                    isCurrent && 'bg-accent/60'
                  )}
                >
                  <span className='flex flex-col'>
                    <span className='text-sm font-medium'>{native}</span>
                    {english !== native && (
                      <span className='text-xs text-muted-foreground' lang='en'>
                        {english}
                      </span>
                    )}
                  </span>
                  {isCurrent && (
                    <CheckIcon
                      className='h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                      aria-hidden='true'
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
