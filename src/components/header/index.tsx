import type { LanguageHintStrings } from './language-hint';

import { getLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { UserMenu } from '../auth/user-menu';
import { Logo } from './logo';
import { Navigation } from './navigation';

/** The language hint's strings for every locale other than the page's, each in its own language. */
async function getLanguageHints(
  locale: string
): Promise<Record<string, LanguageHintStrings>> {
  const entries = await Promise.all(
    routing.locales
      .filter(l => l !== locale)
      .map(async l => {
        const t = await getTranslations({
          locale: l,
          namespace: 'Common.languageNote',
        });
        const strings: LanguageHintStrings = {
          message: t('message'),
          dismiss: t('dismiss'),
        };
        return [l, strings] as const;
      })
  );
  return Object.fromEntries(entries);
}

export async function Header() {
  const hints = await getLanguageHints(await getLocale());

  return (
    <header className='header w-full'>
      <div className='max-w-[960px] mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <Logo />
          {/* Navigation and Actions */}
          <div className='flex items-center gap-4'>
            <Navigation />
            <UserMenu hints={hints} />
          </div>
        </div>
      </div>
    </header>
  );
}
