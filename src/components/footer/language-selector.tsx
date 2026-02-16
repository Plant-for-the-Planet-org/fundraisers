'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LanguageSelector() {
  const t = useTranslations('Common');
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-labelledby='language-selector-label'>
      <ul className='flex items-center justify-center md:justify-start gap-2 text-xs text-zinc-500 list-none p-0 m-0'>
        <li id='language-selector-label'>{t('languageSelectionLabel')}</li>
        {routing.locales.map((locale, index) => (
          <li key={locale} className='flex items-center gap-2'>
            {index > 0 && (
              <span className='text-zinc-300' aria-hidden='true'>
                |
              </span>
            )}
            <Link
              href={pathname}
              locale={locale}
              lang={locale}
              aria-current={currentLocale === locale ? 'page' : undefined}
              className={
                currentLocale === locale
                  ? 'underline text-zinc-900'
                  : 'hover:text-zinc-700'
              }
            >
              {locale.toUpperCase()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
