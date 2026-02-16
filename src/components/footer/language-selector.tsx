'use client';

import { useTranslations } from 'next-intl';
import { useLocaleStore } from '@/stores/localeStore';
import { routing } from '@/i18n/routing';

export function LanguageSelector() {
  const t = useTranslations('Common');
  const localeFromStore = useLocaleStore(state => state.locale);
  const setLocale = useLocaleStore(state => state.setLocale);

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
            <button
              onClick={() => setLocale(locale)}
              lang={locale}
              aria-current={localeFromStore === locale ? 'page' : undefined}
              className={
                localeFromStore === locale
                  ? 'underline text-zinc-900'
                  : 'hover:text-zinc-700'
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
