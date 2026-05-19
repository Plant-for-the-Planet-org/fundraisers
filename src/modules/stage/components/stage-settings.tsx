'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { startTransition } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Monitor } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StageModePanel } from './stage-mode-panel';

const DEFAULT_STAGE_CONFIG: NonNullable<
  FundraiserFormValues['settings']['modules']['stage']
> = {
  enabled: true,
  locale: 'en',
  title: '',
  description: '',
  partner_logo_url: '',
  slides: [{ position: 1, title: '', description: '', image: '', duration: 8 }],
};

export function StageMenuItem() {
  const { setValue } = useFormContext<FundraiserFormValues>();
  const t = useTranslations('Fundraisers.form.options.stage');
  const stageAdded =
    useWatch<FundraiserFormValues, 'settings.modules.stage'>({
      name: 'settings.modules.stage',
    }) !== null;

  const addStage = () =>
    startTransition(() =>
      setValue('settings.modules.stage', DEFAULT_STAGE_CONFIG, {
        shouldDirty: true,
      })
    );

  return (
    <DropdownMenuItem
      onClick={addStage}
      disabled={stageAdded}
      className='flex cursor-pointer items-start gap-3 py-3'
    >
      <div className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary'>
        <Monitor size={14} />
      </div>
      <div className='flex min-w-0 flex-col'>
        <span className='text-sm font-semibold'>{t('title')}</span>
        <span className='mt-0.5 text-xs leading-snug text-muted-foreground'>
          {t('blurb')}
        </span>
      </div>
    </DropdownMenuItem>
  );
}

export function StageSection() {
  const { setValue } = useFormContext<FundraiserFormValues>();
  const stageConfig = useWatch<FundraiserFormValues, 'settings.modules.stage'>({
    name: 'settings.modules.stage',
  });

  if (!stageConfig) return null;

  const removeStage = () =>
    setValue('settings.modules.stage', null, { shouldDirty: true });

  return <StageModePanel onRemove={removeStage} />;
}
