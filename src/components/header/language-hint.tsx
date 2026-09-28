'use client';

import type { ReactNode } from 'react';

import { useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { XIcon } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { toast } from 'sonner';
import { useLocaleStore } from '@/stores/locale-store';
import { Button } from '@/components/ui/button';
import { readCookie, writeCookie } from '@/i18n/locale-cookie';
import { isLocalizedPath, splitLocalePrefix } from '@/i18n/localized-paths';
import {
  matchBrowserLocale,
  serializeLocaleCookieValue,
} from '@/i18n/resolve-locale';

export type LanguageHintStrings = {
  message: string;
  dismiss: string;
};

/** A language's name in that language, e.g. "Deutsch". */
export function nativeName(locale: string): string {
  const name =
    new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale;
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** Switches the UI language the same way everywhere: when signed in it also saves to the profile, which otherwise wins and switches straight back. */
export function useChooseLocale() {
  const locale = useLocale();
  const t = useTranslations('Common');
  const setLocale = useLocaleStore(state => state.setLocale);
  return (choice: string) => {
    if (choice === locale) return;
    setLocale(choice).catch(() => toast.error(t('languageSaveFailed')));
  };
}

const subscribe = () => () => {};

/** The browser's language, but only while the visitor has not saved a language yet. */
function getBrowserLocaleWithoutSavedChoice(): string | null {
  if (readCookie('ui-locale')) return null;
  return matchBrowserLocale(navigator.languages.join(',')) ?? null;
}

/**
 * Wraps the header menu button. When the browser's language differs from the page's, a hint points at the button and offers it, e.g. "Also available in English".
 * Only on localized pages, and only until the visitor picks a language. The hint is written in the offered language, so the visitor can read it.
 * Once the menu has been opened, the hint stays hidden: the visitor has found where languages live.
 */
export function LanguageHint({
  hints,
  menuOpen,
  children,
}: {
  /** Hint strings per offered locale, each in its own language. */
  hints: Record<string, LanguageHintStrings>;
  menuOpen: boolean;
  children: ReactNode;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const choose = useChooseLocale();
  const browserLocale = useSyncExternalStore(
    subscribe,
    getBrowserLocaleWithoutSavedChoice,
    () => null
  );
  const [hidden, setHidden] = useState(false);
  if (menuOpen && !hidden) setHidden(true);

  const target =
    browserLocale && browserLocale !== locale ? browserLocale : null;
  const hint = target ? hints[target] : undefined;
  const open =
    !!hint && !hidden && isLocalizedPath(splitLocalePrefix(pathname).pathname);

  const dismiss = () => {
    writeCookie(
      'ui-locale',
      serializeLocaleCookieValue(locale, 'explicit'),
      365
    );
    setHidden(true);
  };

  return (
    <PopoverPrimitive.Root open={open}>
      <PopoverPrimitive.Anchor asChild>{children}</PopoverPrimitive.Anchor>
      {target && hint && (
        // No portal: the hint stays inside the theme wrapper, so it picks up the page's accent color.
        <PopoverPrimitive.Content
          align='end'
          sideOffset={6}
          lang={target}
          // A hint, not a dialog: it must not pull focus away from the page.
          onOpenAutoFocus={event => event.preventDefault()}
          className='z-50 flex items-center gap-1 rounded-xl border border-border bg-popover py-1.5 pl-3 pr-1 text-sm text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
        >
          <p>
            {hint.message}{' '}
            <button
              type='button'
              className='font-semibold text-accent-color underline underline-offset-4 hover:opacity-80'
              onClick={() => choose(target)}
            >
              {nativeName(target)}
            </button>
          </p>
          <Button
            variant='ghost'
            size='icon-sm'
            className='shrink-0 rounded-full text-muted-foreground'
            aria-label={hint.dismiss}
            onClick={dismiss}
          >
            <XIcon />
          </Button>
          {/* A rotated square rather than the default triangle, so the caret carries the card's border. */}
          <PopoverPrimitive.Arrow asChild width={12} height={6}>
            <span className='block h-3 w-3 -translate-y-1/2 rotate-45 border-r border-b border-border bg-popover' />
          </PopoverPrimitive.Arrow>
        </PopoverPrimitive.Content>
      )}
    </PopoverPrimitive.Root>
  );
}
