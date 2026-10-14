'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isProtectedRoute } from '@/lib/utils/auth';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/auth-store';
import { openSignInModal } from '@/stores/sign-in-modal-store';
import { PlusIcon } from '@/components/ui/ui-icons';
import { getHeaderLinks } from './config';

export function Navigation() {
  const pathname = usePathname();
  const tHeaderLinks = useTranslations('Common.headerLinks');
  const tAria = useTranslations('Common.aria');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  const displayedLinks = getHeaderLinks(pathname);

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
              className={cn(
                'text-sm font-medium transition-colors',
                // Starting a fundraiser is the main thing to do here, so it is a filled button; Explore stays a quiet link.
                link.labelKey === 'startFundraiser'
                  ? 'inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-color px-4 font-semibold text-[var(--cta-foreground,#fff)] shadow-xs hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.labelKey === 'startFundraiser' && (
                <PlusIcon className='size-3.5' />
              )}
              {tHeaderLinks(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
