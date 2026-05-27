'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { inferThankYouOccasionId, THANK_YOU_MESSAGE_LIMITS } from './constants';
import { ThankYouSuggestionsDialog } from './thank-you-suggestions-dialog';

function CharCount({ current, max }: { current: number; max: number }) {
  const color =
    current > max
      ? 'text-destructive'
      : current > max * 0.85
        ? 'text-orange-500'
        : 'text-muted-foreground';
  return (
    <span className={`text-[10px] tabular-nums ${color}`}>
      {current}/{max}
    </span>
  );
}

export function ThankYouNotePanel() {
  const t = useTranslations('Fundraisers.form.options.thankYouNote');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const { control, setValue } = useFormContext<FundraiserFormValues>();

  const enabled = useWatch({
    control,
    name: 'settings.modules.thankYouNote.enabled',
  });
  const messageVal =
    (useWatch({
      control,
      name: 'settings.modules.thankYouNote.message' as any,
    }) as string) ?? '';
  const title = useWatch({ control, name: 'title' });
  const bundleSlug = useWatch({
    control,
    name: 'settings.modules.bundle.slug',
  });

  const textLength = getRichTextTextContent(messageVal).length;
  const recommendedOccasionId = inferThankYouOccasionId(title, bundleSlug);

  const fillMessage = (html: string) => {
    setValue('settings.modules.thankYouNote.message', html, {
      shouldDirty: true,
    });
  };

  return (
    <div>
      {/* Header */}
      <label className='flex cursor-pointer items-center justify-between gap-3'>
        <div className='flex min-w-0 flex-col'>
          <span className='text-sm font-medium'>{t('title')}</span>
          <span className='text-xs text-muted-foreground'>{t('subtitle')}</span>
        </div>

        <Controller
          control={control}
          name='settings.modules.thankYouNote.enabled'
          render={({ field }) => (
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
              aria-label={t('toggleEnabled')}
            />
          )}
        />
      </label>

      {enabled && (
        <div className='mt-3 rounded-lg bg-white dark:bg-background p-4'>
          {/* Rich text editor */}
          <div className='relative'>
            <Controller
              control={control}
              name='settings.modules.thankYouNote.message'
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('editorPlaceholder')}
                  aria-label={t('messageLabel')}
                  extraToolbarActions={
                    <button
                      type='button'
                      onClick={() => setSuggestionsOpen(true)}
                      title={t('suggestionsTitle')}
                      aria-label={t('suggestionsTitle')}
                      className='h-8 inline-flex items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    >
                      <Sparkles className='h-4 w-4' />
                      <span className='hidden sm:inline'>
                        {t('suggestionsButton')}
                      </span>
                    </button>
                  }
                />
              )}
            />
            <div className='pointer-events-none absolute bottom-2 right-3'>
              <CharCount
                current={textLength}
                max={THANK_YOU_MESSAGE_LIMITS.message}
              />
            </div>
          </div>
        </div>
      )}

      <ThankYouSuggestionsDialog
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
        recommendedOccasionId={recommendedOccasionId}
        onSelect={fillMessage}
      />
    </div>
  );
}
