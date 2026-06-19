'use client';

import type { Control, FieldPath, FieldPathValue } from 'react-hook-form';
import type { FundraiserFormValues } from './fundraiser-form-schema';

import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { ThankYouNotePanel } from '@/components/thank-you-note/thank-you-note-panel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { StageMenuItem, StageSection } from '@/modules/stage';
import { SectionHeader } from './typography';

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

function AddModuleMenu() {
  const t = useTranslations('Fundraisers.form.options');

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-7 border-dashed'
          aria-label={t('addModule')}
        >
          <Plus size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72'>
        <DropdownMenuLabel className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
          {t('addModule')}
        </DropdownMenuLabel>
        <StageMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Options() {
  const { control } = useFormContext<FormValues>();
  const t = useTranslations('Fundraisers.form.options');

  return (
    <div
      role='group'
      aria-label={t('sectionHeading')}
      className='options flex flex-col gap-3'
    >
      <SectionHeader
        className='flex-row items-center justify-between mb-1'
        actionSlot={<AddModuleMenu />}
      >
        {t('sectionHeading')}
      </SectionHeader>

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

      <ThankYouNotePanel />

      <StageSection />
    </div>
  );
}
