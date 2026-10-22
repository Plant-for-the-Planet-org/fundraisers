'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isProtectedRoute } from '@/lib/utils/auth';
import { cn } from '@/lib/utils/index';
import { useAuthStore } from '@/stores/auth-store';
import { openSignInModal } from '@/stores/sign-in-modal-store';
import { buttonVariants } from '@/components/ui/button';
import { HEADER_LINKS } from './config';

const HIDE_START_FUNDRAISER_PATHS = [
  '/fundraisers/create',
  '/dashboard/fundraisers/edit',
];

// Start Fundraiser is a filled button only where people are browsing for ideas. Elsewhere (donating, signing in, the dashboard) it stays a quiet link so it does not compete with the page's own task.
const CTA_START_FUNDRAISER_PATHS = ['/', '/explore'];

function isCtaPath(pathname: string) {
  return CTA_START_FUNDRAISER_PATHS.some(p =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  );
}

export function Navigation() {
  const pathname = usePathname();
  const tHeaderLinks = useTranslations('Common.headerLinks');
  const tAria = useTranslations('Common.aria');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  // Category pages keep the Explore link: it is the way back to the main list.
  const displayedLinks = HEADER_LINKS.filter(link => {
    if (link.labelKey === 'explore') return pathname !== '/explore';
    return !HIDE_START_FUNDRAISER_PATHS.some(p => pathname.startsWith(p));
  });

  const showStartFundraiserCta = isCtaPath(pathname);

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
              className={
                link.labelKey === 'startFundraiser' && showStartFundraiserCta
                  ? cn(
                      buttonVariants({ size: 'sm' }),
                      'rounded-full bg-foreground px-4 text-background hover:bg-foreground/85'
                    )
                  : 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              {tHeaderLinks(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
