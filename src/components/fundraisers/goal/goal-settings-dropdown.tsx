'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { memo, useState } from 'react';
import { useController } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

type BooleanDonorScoreKey = 'show_goal' | 'show_days_left';

function DonorScoreToggle({ field }: { field: BooleanDonorScoreKey }) {
  const { field: ctrl } = useController<FundraiserFormValues>({
    name: `settings.modules.donor_score.${field}`,
  });

  const t = useTranslations('Fundraisers.form.goalSettings');
  const label = field === 'show_goal' ? t('showGoal') : t('showDaysLeft');
  const id = `goal-${field}`;

  return (
    <div className='flex items-center justify-between gap-4'>
      <label htmlFor={id} className='text-sm cursor-pointer'>
        {label}
      </label>
      <Switch
        size='compact'
        id={id}
        checked={Boolean(ctrl.value)}
        onCheckedChange={ctrl.onChange}
      />
    </div>
  );
}

export const GoalSettingsDropdown = memo(function GoalSettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Fundraisers.form.goalSettings');

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='p-1 h-auto hover:bg-muted-foreground/15 dark:hover:bg-muted-foreground/30'
          aria-label={t('openSettings')}
        >
          {isOpen ? (
            <X className='w-4 h-4' />
          ) : (
            <Settings2 className='w-4 h-4' />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56 p-4 border-border'>
        <div className='space-y-3'>
          <DonorScoreToggle field='show_goal' />
          <DonorScoreToggle field='show_days_left' />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
