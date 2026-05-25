'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { startTransition } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MessageSquareHeart } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ThankYouMessagePanel } from './thank-you-message-panel';

const DEFAULT_THANK_YOU_MESSAGE_CONFIG: NonNullable<
  FundraiserFormValues['settings']['modules']['thankYouMessage']
> = {
  enabled: true,
  message: '',
};

export function ThankYouMessageMenuItem() {
  const { setValue } = useFormContext<FundraiserFormValues>();
  const t = useTranslations('Fundraisers.form.options.thankYouMessage');
  const isAdded =
    useWatch<FundraiserFormValues, 'settings.modules.thankYouMessage'>({
      name: 'settings.modules.thankYouMessage',
    }) !== null;

  const add = () =>
    startTransition(() =>
      setValue(
        'settings.modules.thankYouMessage',
        DEFAULT_THANK_YOU_MESSAGE_CONFIG,
        { shouldDirty: true }
      )
    );

  return (
    <DropdownMenuItem
      onClick={add}
      disabled={isAdded}
      className='flex cursor-pointer items-start gap-3 py-3'
    >
      <div className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary'>
        <MessageSquareHeart size={14} />
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

export function ThankYouMessageSection() {
  const { setValue } = useFormContext<FundraiserFormValues>();
  const config = useWatch<
    FundraiserFormValues,
    'settings.modules.thankYouMessage'
  >({
    name: 'settings.modules.thankYouMessage',
  });

  if (!config) return null;

  const remove = () =>
    setValue('settings.modules.thankYouMessage', null, { shouldDirty: true });

  return <ThankYouMessagePanel onRemove={remove} />;
}
