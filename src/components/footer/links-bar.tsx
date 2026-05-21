'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CookieSettingsButton } from '../cookie/cookie-settings-button';
import { FOOTER_LINKS, getFooterLinkHref } from './config';

export function LinksBar() {
  const tLinks = useTranslations('Common.legalLinks');
  const locale = useLocale();

  return (
    <nav className='links-bar' aria-label='Legal links'>
      <ul className='flex flex-wrap items-center justify-center md:justify-start gap-1 text-xs text-muted-foreground list-none p-0 m-0'>
        {FOOTER_LINKS.map((link, index) => (
          <li key={link.labelKey} className='flex items-center gap-1'>
            {index > 0 && (
              <span className='text-muted-foreground/40' aria-hidden='true'>
                •
              </span>
            )}
            <a
              href={getFooterLinkHref(link, locale)}
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-foreground'
            >
              {tLinks(link.labelKey)}
            </a>
          </li>
        ))}
        <span className='text-muted-foreground/40'>•</span>
        <CookieSettingsButton className='text-xs text-muted-foreground hover:text-foreground p-0 h-auto' />
      </ul>
    </nav>
  );
}
