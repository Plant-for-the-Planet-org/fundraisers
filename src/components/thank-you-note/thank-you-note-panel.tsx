'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import {
  Controller,
  useController,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { CharCount } from '@/components/fundraisers/char-count';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { inferThankYouOccasionId, THANK_YOU_NOTE_LIMITS } from './constants';
import { ThankYouSuggestionsDialog } from './thank-you-suggestions-dialog';

export function ThankYouNotePanel() {
  const t = useTranslations('Fundraisers.form.options.thankYouNote');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const { control, setValue } = useFormContext<FundraiserFormValues>();

  const { field: messageField } = useController({
    control,
    name: 'settings.modules.thankYouNote.message',
  });

  const [enabled, title, bundleSlug] = useWatch({
    control,
    name: [
      'settings.modules.thankYouNote.enabled',
      'title',
      'settings.modules.bundle.slug',
    ],
  });

  const textLength = getRichTextTextContent(messageField.value ?? '').length;
  const recommendedOccasionId = inferThankYouOccasionId(title, bundleSlug);

  const fillMessage = (html: string) => {
    setValue('settings.modules.thankYouNote.message', html, {
      shouldDirty: true,
      shouldValidate: true,
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
            <RichTextEditor
              value={messageField.value}
              onChange={messageField.onChange}
              onBlur={messageField.onBlur}
              placeholder={t('editorPlaceholder')}
              aria-label={t('messageLabel')}
              editableAreaClassName='pr-10'
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
            <div className='pointer-events-none absolute bottom-2 right-3'>
              <CharCount
                current={textLength}
                max={THANK_YOU_NOTE_LIMITS.message}
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
