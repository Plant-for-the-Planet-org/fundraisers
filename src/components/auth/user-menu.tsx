'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, Compass, CreditCard, Plus, UserCog } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
import { ImpersonationModal } from '@/components/auth/impersonation-modal';
import { SignInButton } from '@/components/auth/sign-in-button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/drop-down-menu';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';

const IMPERSONATION_DOMAIN = '@plant-for-the-planet.org';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [impersonationModalOpen, setImpersonationModalOpen] = useState(false);
  const isImpersonating = useImpersonationStore(state => state.isActive);

  const tDashboard = useTranslations('Dashboard');
  const tFundraiser = useTranslations('Fundraisers');
  const tHeaderLinks = useTranslations('Common.headerLinks');
  const tAuth = useTranslations('Auth');

  const pathname = usePathname();
  // store: state
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.user?.profile);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  if (isAuthInitializing) {
    return <div className='w-14 h-8 bg-gray-200 rounded-full animate-pulse' />;
  }

  // Auth-flow pages have their own sign-in entry point, so the header button
  // is redundant there (and would capture the page itself as redirectTo).
  const isAuthFlowPage =
    pathname.startsWith('/login') || pathname.startsWith('/verify-email');

  if (!isAuthInitializing && !isAuthenticated && !isAuthFlowPage) {
    return <SignInButton />;
  }

  if (!isAuthenticated) return null;

  const profileImage = profile?.image || user?.picture;
  const profileImageUrl = getImageUrl('profile', 'thumb', profileImage);
  const displayName = profile?.displayName || user?.name;
  const userEmail = profile?.email || user?.email;
  const canImpersonate = !!userEmail?.endsWith(IMPERSONATION_DOMAIN);

  return (
    <>
      <DropdownMenu onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            aria-label={tAuth('userMenuLabel')}
            className='h-9 w-auto rounded-full p-0.5 pr-2 flex items-center gap-1 focus-visible:ring-0 focus-visible:ring-offset-0 has-[>svg]:p-0.5 has-[>svg]:pr-2'
          >
            <Avatar className='h-8 w-8'>
              {profileImageUrl && (
                <AvatarImage src={profileImageUrl} alt='' loading='lazy' />
              )}
              <FallbackAvatar
                seed={profile?.id ?? userEmail ?? displayName ?? 'user'}
              />
            </Avatar>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-66 rounded-xl border border-border bg-background/95 backdrop-blur shadow-xl'
          align='end'
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              {profile?.type !== 'individual' && profile?.name && (
                <span className='text-xs leading-normal text-muted-foreground truncate max-w-full'>
                  {profile.name}
                </span>
              )}
              <span className='text-sm font-medium leading-normal truncate max-w-full'>
                {displayName || tAuth('impersonation.userDefault')}
              </span>
              <span className='text-xs leading-normal text-muted-foreground truncate max-w-full'>
                {userEmail}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className='cursor-pointer xs:hidden'>
            <Link href='/explore' className='flex items-center'>
              <Compass className='mr-2 h-4 w-4' />
              <span>{tHeaderLinks('explore')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className='cursor-pointer xs:hidden'>
            <Link href='/fundraisers/create' className='flex items-center'>
              <Plus className='mr-2 h-4 w-4' />
              <span>{tFundraiser('startFundraiser')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href='/dashboard' className='flex items-center'>
              <CreditCard className='mr-2 h-4 w-4' />
              <span>{tDashboard('breadcrumb.dashboard')}</span>
            </Link>
          </DropdownMenuItem>
          {canImpersonate && (
            <DropdownMenuItem
              className='cursor-pointer'
              onSelect={e => {
                e.preventDefault();
                setImpersonationModalOpen(true);
              }}
            >
              <UserCog className='mr-2 h-4 w-4' />
              <span>
                {isImpersonating
                  ? tAuth('impersonation.switch')
                  : tAuth('impersonation.title')}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <SignOutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {canImpersonate && (
        <ImpersonationModal
          open={impersonationModalOpen}
          onClose={() => setImpersonationModalOpen(false)}
        />
      )}
    </>
  );
}
