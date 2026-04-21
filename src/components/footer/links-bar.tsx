'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CookieSettingsButton } from '../cookie/cookie-settings-button';
import { FOOTER_LINKS, getFooterLinkHref } from './config';

export function LinksBar() {
  const tLinks = useTranslations('Common.legalLinks');
  const locale = useLocale();

  return (
    <nav className='links-bar' aria-label='Legal links'>
      <ul className='flex flex-wrap items-center justify-center md:justify-start gap-1 text-xs text-zinc-500 list-none p-0 m-0'>
        {FOOTER_LINKS.map((link, index) => (
          <li key={link.labelKey} className='flex items-center gap-1'>
            {index > 0 && (
              <span className='text-zinc-300' aria-hidden='true'>
                •
              </span>
            )}
            <a
              href={getFooterLinkHref(link, locale)}
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-zinc-700'
            >
              {tLinks(link.labelKey)}
            </a>
          </li>
        ))}
        <span className='text-zinc-300'>•</span>
        <CookieSettingsButton className='text-xs text-zinc-500 hover:text-zinc-700 p-0 h-auto' />
      </ul>
    </nav>
  );
}
