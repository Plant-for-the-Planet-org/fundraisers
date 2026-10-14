'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionSettingsButton } from '@/components/fundraisers/section-settings-button';
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

  const groups: {
    title: string;
    options: { key: BooleanLeaderboardKey; label: string; hint?: string }[];
  }[] = [
    {
      title: t('groups.lists'),
      options: [
        { key: 'show_recent_list', label: t('labels.showRecentList') },
        {
          key: 'show_top_list',
          label: t('labels.showTopList'),
          hint: t('hints.showTopList'),
        },
        {
          key: 'aggregate_top_by_donor',
          label: t('labels.groupTopByDonor'),
          hint: t('hints.groupTopByDonor'),
        },
      ],
    },
    {
      title: t('groups.rows'),
      options: [
        { key: 'show_amount', label: t('labels.showAmounts') },
        { key: 'show_avatar', label: t('labels.showAvatars') },
        {
          key: 'anonymize',
          label: t('labels.anonymizeDonors'),
          hint: t('hints.anonymizeDonors'),
        },
      ],
    },
    {
      title: t('groups.more'),
      options: [
        {
          key: 'view_all',
          label: t('labels.viewAllButton'),
          hint: t('hints.viewAllButton'),
        },
      ],
    },
  ];

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <SectionSettingsButton
          isOpen={isOpen}
          aria-label={t('labels.openSettings')}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        collisionPadding={{ top: 16, right: 16, bottom: 84, left: 16 }}
        className='w-[min(20rem,calc(100vw-2rem))] overscroll-contain p-4 border-border'
      >
        <div className='space-y-4'>
          {groups.map(group => (
            <section key={group.title} className='space-y-3'>
              <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                {group.title}
              </h3>
              {group.options.map(({ key, label, hint }) => (
                <div
                  key={key}
                  className='flex items-start justify-between gap-4'
                >
                  <div className='grid gap-0.5'>
                    <label
                      htmlFor={`leaderboard-${key}`}
                      className='text-sm cursor-pointer'
                    >
                      {label}
                    </label>
                    {hint && (
                      <p
                        id={`leaderboard-${key}-hint`}
                        className='text-xs text-muted-foreground'
                      >
                        {hint}
                      </p>
                    )}
                  </div>
                  <Switch
                    size='compact'
                    id={`leaderboard-${key}`}
                    aria-describedby={
                      hint ? `leaderboard-${key}-hint` : undefined
                    }
                    checked={settings[key]}
                    onCheckedChange={checked => onChange(key, checked)}
                    className='mt-0.5 shrink-0'
                  />
                </div>
              ))}
            </section>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
