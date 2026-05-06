'use client';

import type { Control, FieldPath, FieldPathValue } from 'react-hook-form';
import type { FundraiserFormValues } from './fundraiser-form-schema';

import { startTransition } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Monitor, Plus } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heading2 } from './typography';
import { StageModePanel } from '@/components/stage/stage-mode-panel';

type FormValues = FundraiserFormValues;

interface SwitchFieldProps<TName extends FieldPath<FormValues>> {
  control: Control<FormValues>;
  name: TName;
  label: string;
  description: string;
  descriptionId: string;
  onValue: FieldPathValue<FormValues, TName>;
  offValue: FieldPathValue<FormValues, TName>;
}

function SwitchField<TName extends FieldPath<FormValues>>({
  control,
  name,
  label,
  description,
  descriptionId,
  onValue,
  offValue,
}: SwitchFieldProps<TName>) {
  return (
    <label className='flex cursor-pointer items-center justify-between'>
      <div className='flex flex-col'>
        <span className='text-sm font-medium'>{label}</span>
        <span id={descriptionId} className='text-xs text-muted-foreground'>
          {description}
        </span>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            aria-describedby={descriptionId}
            checked={field.value === onValue}
            onCheckedChange={checked =>
              field.onChange(checked ? onValue : offValue)
            }
          />
        )}
      />
    </label>
  );
}

const DEFAULT_STAGE_CONFIG: NonNullable<
  FormValues['settings']['modules']['stage']
> = {
  enabled: true,
  locale: 'en',
  title: '',
  description: '',
  partner_logo_url: '',
  slides: [
    {
      position: 1,
      title: '',
      description: '',
      image: '',
      duration: 8,
    },
  ],
};

export function Options() {
  const { control, setValue, watch } = useFormContext<FormValues>();
  const t = useTranslations('Fundraisers.form.options');
  const tStage = useTranslations('Fundraisers.form.options.stage');

  const stageConfig = watch('settings.modules.stage');
  const stageAdded = stageConfig !== null && stageConfig !== undefined;

  const addStage = () =>
    startTransition(() =>
      setValue('settings.modules.stage', DEFAULT_STAGE_CONFIG, { shouldDirty: true })
    );
  const removeStage = () => setValue('settings.modules.stage', null, { shouldDirty: true });

  return (
    <div
      role='group'
      aria-label={t('sectionHeading')}
      className='options flex flex-col gap-3'
    >
      <div className='flex flex-col'>
        <div className='flex items-center justify-between mb-1'>
          <Heading2>{t('sectionHeading')}</Heading2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-7 border-dashed'
                aria-label={t('addModule')}
                disabled={stageAdded}
              >
                <Plus size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-72'>
              <DropdownMenuLabel className='text-xs uppercase tracking-wide text-muted-foreground font-bold'>
                {t('addModule')}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={addStage}
                disabled={stageAdded}
                className='flex items-start gap-3 py-3 cursor-pointer'
              >
                <div className='size-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5'>
                  <Monitor size={14} />
                </div>
                <div className='flex flex-col min-w-0'>
                  <span className='text-sm font-semibold'>{tStage('title')}</span>
                  <span className='text-xs text-muted-foreground leading-snug mt-0.5'>
                    {tStage('blurb')}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='h-px bg-gray-200 dark:bg-gray-700' />
      </div>

      <SwitchField
        control={control}
        name='status'
        label={t('status.label')}
        description={t('status.description')}
        descriptionId='status-desc'
        onValue='active'
        offValue='draft'
      />

      <SwitchField
        control={control}
        name='visibility'
        label={t('visibility.label')}
        description={t('visibility.description')}
        descriptionId='visibility-desc'
        onValue='public'
        offValue='unlisted'
      />

      {stageAdded && <StageModePanel onRemove={removeStage} />}
    </div>
  );
}
