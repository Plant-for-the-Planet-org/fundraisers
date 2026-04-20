'use client';

import type { Control, FieldPath, FieldPathValue } from 'react-hook-form';
import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from './typography';

type FormValues = CreateFundraiserFormValues;

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

export function Options() {
  const { control } = useFormContext<FormValues>();
  const t = useTranslations('Fundraisers.form.options');

  return (
    <div
      role='group'
      aria-label={t('sectionHeading')}
      className='options flex flex-col gap-3'
    >
      <SectionHeader>{t('sectionHeading')}</SectionHeader>

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
    </div>
  );
}
