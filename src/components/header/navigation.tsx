'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useHeaderVisibility } from '@/lib/hooks/use-header-visibility';
import { HEADER_LINKS } from './config';

export function Navigation() {
  const tHeaderLinks = useTranslations('Common.headerLinks');
  const tAria = useTranslations('Common.aria');
  const visibility = useHeaderVisibility();

  if (!visibility.primaryNav) return null;

  const displayedLinks = HEADER_LINKS.filter(
    link => link.visibilityFlag === null || visibility[link.visibilityFlag]
  );

  return (
    <nav
      className='navigation hidden xs:flex items-center gap-4'
      aria-label={tAria('primaryNavigation')}
    >
      <ul className='flex items-center gap-4 list-none p-0 m-0'>
        {displayedLinks.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              {tHeaderLinks(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
