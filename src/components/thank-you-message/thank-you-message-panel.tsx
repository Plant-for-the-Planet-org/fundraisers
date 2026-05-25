'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, X } from 'lucide-react';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  THANK_YOU_MESSAGE_LIMITS,
  THANK_YOU_PRESET_MESSAGES,
  THANK_YOU_TOPICS,
} from './constants';
import { SimpleRichTextEditor } from './simple-rich-text-editor';

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

export function ThankYouMessagePanel({ onRemove }: { onRemove: () => void }) {
  const t = useTranslations('Fundraisers.form.options.thankYouMessage');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { control, setValue } = useFormContext<FundraiserFormValues>();

  const messageVal =
    (useWatch({
      control,
      name: 'settings.modules.thankYouMessage.message' as any,
    }) as string) ?? '';

  const textLength = getRichTextTextContent(messageVal).length;
  const presetLocale = locale === 'de' ? 'de' : 'en';
  const presetMessages = selectedTopic
    ? (THANK_YOU_PRESET_MESSAGES[selectedTopic]?.[presetLocale] ?? [])
    : [];

  const fillPreset = (text: string) => {
    setValue('settings.modules.thankYouMessage.message', `<p>${text}</p>`, {
      shouldDirty: true,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className='flex items-center gap-3 pb-3'>
        <button
          type='button'
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? t('collapse') : t('expand')}
          aria-expanded={expanded}
          className='text-muted-foreground hover:text-foreground transition-colors'
        >
          <ChevronRight
            size={16}
            className='transition-transform duration-150'
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        </button>

        <div className='flex-1 min-w-0'>
          <span className='text-sm font-semibold'>{t('title')}</span>
          <p className='text-xs text-muted-foreground mt-0.5'>
            {t('subtitle')}
          </p>
        </div>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          onClick={onRemove}
          aria-label={t('remove')}
        >
          <X size={14} />
        </Button>

        <Controller
          control={control}
          name='settings.modules.thankYouMessage.enabled'
          render={({ field }) => (
            <Switch
              checked={field.value ?? true}
              onCheckedChange={field.onChange}
              aria-label={t('toggleEnabled')}
            />
          )}
        />
      </div>

      {expanded && (
        <div className='mb-3 rounded-lg bg-white dark:bg-background p-4 flex flex-col gap-4'>
          {/* Preset topic picker */}
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs font-semibold'>{t('presetTopic')}</span>
            <Select
              value={selectedTopic ?? ''}
              onValueChange={val => setSelectedTopic(val || null)}
            >
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder={t('presetTopicPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {THANK_YOU_TOPICS.map(topic => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {t(`presetTopics.${topic.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset message cards */}
          {presetMessages.length > 0 && (
            <div className='flex flex-col gap-2'>
              {presetMessages.map(preset => (
                <button
                  key={preset.id}
                  type='button'
                  onClick={() => fillPreset(preset.text)}
                  className='text-left rounded-md border border-input px-3 py-2 text-xs leading-relaxed text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer'
                >
                  {preset.text}
                </button>
              ))}
            </div>
          )}

          {/* Rich text editor */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold'>{t('messageLabel')}</span>
              <CharCount
                current={textLength}
                max={THANK_YOU_MESSAGE_LIMITS.message}
              />
            </div>
            <Controller
              control={control}
              name='settings.modules.thankYouMessage.message'
              render={({ field }) => (
                <SimpleRichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('editorPlaceholder')}
                />
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
