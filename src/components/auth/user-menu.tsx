'use client';

import { useState } from 'react';
import { SignInButton } from './sign-in-button';
import { useAuthStore } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/drop-down-menu';
import { Button } from '../ui/button';
import Link from 'next/link';
import { SignOutButton } from './sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getImageUrl } from '@/lib/utils/images';
import { ChevronDown, CreditCard, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const tDashboard = useTranslations('dashboard');
  const tFundraiser = useTranslations('Fundraisers');

  const pathname = usePathname();
  // store: state
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.user?.profile);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);

  if (isLoading) {
    return <div className='w-14 h-8 bg-gray-200 rounded-full animate-pulse' />;
  }

  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return <SignInButton variant='outline' size='sm' />;
  }

  if (!isAuthenticated) return null;

  const profileImage = profile?.image || user?.picture;
  const profileImageUrl = getImageUrl('profile', 'thumb', profileImage);
  const displayName = profile?.displayName || user?.name;
  const userEmail = profile?.email || user?.email;

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='h-8 w-auto rounded-full p-0 pr-1 flex items-center gap-1 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
        >
          <Avatar className='h-8 w-8'>
            {profileImageUrl && (
              <AvatarImage src={profileImageUrl} alt='Profile' loading='lazy' />
            )}
            <AvatarFallback className='bg-linear-to-br from-blue-500 to-purple-600' />
          </Avatar>
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-66  rounded-xl shadow-lg'
        align='end'
        forceMount
      >
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <span className='text-sm font-medium leading-normal truncate max-w-full'>
              {displayName || 'User'}
            </span>
            <span className='text-xs leading-normal text-muted-foreground truncate max-w-full'>
              {userEmail}
            </span>
            {profile?.type && (
              <span className='text-xs leading-normal text-muted-foreground capitalize'>
                {profile.type}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href='/dash' className='flex items-center'>
            <CreditCard className='mr-2 h-4 w-4' />
            <span>{tDashboard('dashboard')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href='/dash/raise/new' className='flex items-center'>
            <Plus className='mr-2 h-4 w-4' />
            <span>{tFundraiser('startFundraiser')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutButton
            variant='ghost'
            size='sm'
            className='text-orange-600 focus:text-orange-600 focus:bg-orange-50 cursor-pointer'
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
