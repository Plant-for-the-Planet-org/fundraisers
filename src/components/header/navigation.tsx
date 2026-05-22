import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { HEADER_LINKS } from './config';

export function Navigation() {
  const tHeaderLinks = useTranslations('Common.headerLinks');

  return (
    <nav
      className='navigation hidden xs:flex items-center gap-6'
      aria-label='Primary navigation'
    >
      <ul className='flex items-center gap-6 list-none p-0 m-0'>
        {HEADER_LINKS.map(link => (
          <li key={link.labelKey}>
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
