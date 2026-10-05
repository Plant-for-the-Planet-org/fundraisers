'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isProtectedRoute } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';
import { openSignInModal } from '@/stores/sign-in-modal-store';
import { HEADER_LINKS } from './config';

const HIDE_START_FUNDRAISER_PATHS = [
  '/fundraisers/create',
  '/dashboard/fundraisers/edit',
];

export function Navigation() {
  const pathname = usePathname();
  const tHeaderLinks = useTranslations('Common.headerLinks');
  const tAria = useTranslations('Common.aria');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  const displayedLinks = HEADER_LINKS.filter(
    link =>
      link.labelKey !== 'startFundraiser' ||
      !HIDE_START_FUNDRAISER_PATHS.some(p => pathname.startsWith(p))
  );

  return (
    <nav
      className='navigation hidden xs:flex items-center gap-4'
      aria-label={tAria('primaryNavigation')}
    >
      <ul className='flex items-center gap-4 list-none p-0 m-0'>
        {displayedLinks.map(link => (
          <li key={link.labelKey}>
            <Link
              href={link.href}
              onClick={event => {
                // Sign in over the current page instead of bouncing through /login. While auth is still loading, let the route's AuthGuard decide.
                if (
                  isAuthenticated ||
                  isAuthInitializing ||
                  !isProtectedRoute(link.href)
                ) {
                  return;
                }
                event.preventDefault();
                openSignInModal(link.href);
              }}
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
