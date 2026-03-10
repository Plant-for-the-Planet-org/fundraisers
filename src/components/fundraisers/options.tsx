'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from './typography';

export function Options() {
  const { control } = useFormContext<CreateFundraiserFormValues>();
  const t = useTranslations('Fundraisers.create.options');

  return (
    <div
      role='group'
      aria-label={t('sectionHeading')}
      className='options flex flex-col gap-3'
    >
      <SectionHeader>{t('sectionHeading')}</SectionHeader>

      <label className='flex cursor-pointer items-center justify-between'>
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>{t('status.label')}</span>
          <span id='status-desc' className='text-xs text-muted-foreground'>
            {t('status.description')}
          </span>
        </div>
        <Controller
          control={control}
          name='status'
          render={({ field }) => (
            <Switch
              aria-describedby='status-desc'
              checked={field.value === 'active'}
              onCheckedChange={checked =>
                field.onChange(checked ? 'active' : 'draft')
              }
            />
          )}
        />
      </label>

      <label className='flex cursor-pointer items-center justify-between'>
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>{t('visibility.label')}</span>
          <span id='visibility-desc' className='text-xs text-muted-foreground'>
            {t('visibility.description')}
          </span>
        </div>
        <Controller
          control={control}
          name='visibility'
          render={({ field }) => (
            <Switch
              aria-describedby='visibility-desc'
              checked={field.value === 'public'}
              onCheckedChange={checked =>
                field.onChange(checked ? 'public' : 'unlisted')
              }
            />
          )}
        />
      </label>
    </div>
  );
}
