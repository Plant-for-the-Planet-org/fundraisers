'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export type BooleanLeaderboardKey =
  | 'show_recent_list'
  | 'show_top_list'
  | 'aggregate_top_by_donor'
  | 'show_amount'
  | 'view_all'
  | 'anonymize'
  | 'show_avatar';

interface LeaderboardSettingsDropdownProps {
  settings: LeaderboardModuleSettings;
  onChange: (key: BooleanLeaderboardKey, checked: boolean) => void;
}

export function LeaderboardSettingsDropdown({
  settings,
  onChange,
}: LeaderboardSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Leaderboard.form');

  const options: { key: BooleanLeaderboardKey; label: string }[] = [
    { key: 'show_recent_list', label: t('labels.showRecentList') },
    { key: 'show_top_list', label: t('labels.showTopList') },
    { key: 'aggregate_top_by_donor', label: t('labels.groupTopByDonor') },
    { key: 'show_amount', label: t('labels.showAmounts') },
    { key: 'view_all', label: t('labels.viewAllButton') },
    { key: 'anonymize', label: t('labels.anonymizeDonors') },
    { key: 'show_avatar', label: t('labels.showAvatars') },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='p-px h-auto'
          aria-label={t('labels.openSettings')}
        >
          {isOpen ? (
            <X className='w-4 h-4' />
          ) : (
            <Settings className='w-4 h-4' />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 p-4 border-border'>
        <div className='space-y-3'>
          {options.map(({ key, label }) => (
            <div key={key} className='flex items-center justify-between gap-4'>
              <label
                htmlFor={`leaderboard-${key}`}
                className='text-sm cursor-pointer'
              >
                {label}
              </label>
              <Switch
                size='compact'
                id={`leaderboard-${key}`}
                checked={settings[key]}
                onCheckedChange={checked => onChange(key, checked)}
              />
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
