'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { startTransition } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
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

/** Stage Mode as one more option, with a switch like the thank-you note's. Its details show while it is on. */
export function StageSection() {
  const { control, setValue } = useFormContext<FundraiserFormValues>();
  const t = useTranslations('Fundraisers.form.options.stage');
  const stageConfig = useWatch<FundraiserFormValues, 'settings.modules.stage'>({
    control,
    name: 'settings.modules.stage',
  });
  const enabled = stageConfig?.enabled === true;

  const toggle = (checked: boolean) => {
    if (checked && !stageConfig) {
      // Clone the default: RHF stores the object by reference and mutates form values in place, so reusing the module-level object would bring back edited slides.
      startTransition(() =>
        setValue(
          'settings.modules.stage',
          structuredClone(DEFAULT_STAGE_CONFIG),
          { shouldDirty: true }
        )
      );
      return;
    }
    // Switching off keeps the slides, so switching on again brings them back.
    if (stageConfig)
      setValue('settings.modules.stage.enabled', checked, {
        shouldDirty: true,
      });
  };

  return (
    <div data-focus='stage'>
      <label className='flex cursor-pointer items-center justify-between gap-3'>
        <div className='flex min-w-0 flex-col'>
          <span className='text-sm font-medium'>{t('title')}</span>
          <span className='text-xs text-muted-foreground'>{t('subtitle')}</span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          aria-label={t('toggleEnabled')}
        />
      </label>
      {enabled && (
        <div className='mt-3'>
          <StageModePanel />
        </div>
      )}
    </div>
  );
}
