'use client';

import { useTranslations } from 'next-intl';
import { useLocaleStore } from '@/stores/locale-store';
import { routing } from '@/i18n/routing';

export function LanguageSelector() {
  const t = useTranslations('Common');
  const localeFromStore = useLocaleStore(state => state.locale);
  const setLocale = useLocaleStore(state => state.setLocale);

  return (
    <nav
      className='language-selector'
      aria-labelledby='language-selector-label'
    >
      <ul className='flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground list-none p-0 m-0'>
        <li id='language-selector-label'>{t('languageSelectionLabel')}</li>
        {routing.locales.map((locale, index) => (
          <li key={locale} className='flex items-center gap-2'>
            {index > 0 && (
              <span className='text-muted-foreground/40' aria-hidden='true'>
                |
              </span>
            )}
            <button
              onClick={() => setLocale(locale)}
              lang={locale}
              aria-current={localeFromStore === locale ? 'page' : undefined}
              className={
                localeFromStore === locale
                  ? 'underline text-foreground'
                  : 'hover:text-foreground'
              }
            >
              {locale.toUpperCase()}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
