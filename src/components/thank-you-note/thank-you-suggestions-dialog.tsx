'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DEFAULT_THANK_YOU_OCCASION_ID,
  THANK_YOU_PRESET_MESSAGES,
  type ThankYouPresetMessage,
} from './constants';

interface ThankYouSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendedOccasionId: string;
  onSelect: (html: string) => void;
}

const CARD_PROSE_CLASSES = [
  '[&_p]:my-1.5',
  '[&_p:first-child]:mt-0',
  '[&_p:last-child]:mb-0',
  '[&_strong]:font-semibold',
  '[&_strong]:text-foreground',
  '[&_em]:italic',
  '[&_u]:underline',
  '[&_s]:line-through',
  '[&_blockquote]:my-1.5',
  '[&_blockquote]:border-l-2',
  '[&_blockquote]:border-l-primary/40',
  '[&_blockquote]:pl-2.5',
  '[&_blockquote]:italic',
  '[&_blockquote]:text-foreground/80',
].join(' ');

function SuggestionCard({
  message,
  onSelect,
}: {
  message: ThankYouPresetMessage;
  onSelect: (html: string) => void;
}) {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect(message.html)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(message.html);
        }
      }}
      className={`cursor-pointer rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${CARD_PROSE_CLASSES}`}
      dangerouslySetInnerHTML={{ __html: message.html }}
    />
  );
}

export function ThankYouSuggestionsDialog({
  open,
  onOpenChange,
  recommendedOccasionId,
  onSelect,
}: ThankYouSuggestionsDialogProps) {
  const t = useTranslations('Fundraisers.form.options.thankYouNote');
  const tActions = useTranslations('Common.actions');
  const locale = useLocale();
  const presetLocale = locale === 'de' ? 'de' : 'en';

  // Only surface a "recommended" block when we actually inferred a specific
  // occasion. Otherwise the general set below is all there is to show.
  const recommendedMessages =
    recommendedOccasionId === DEFAULT_THANK_YOU_OCCASION_ID
      ? []
      : (THANK_YOU_PRESET_MESSAGES[recommendedOccasionId]?.[presetLocale] ??
        []);
  const generalMessages =
    THANK_YOU_PRESET_MESSAGES[DEFAULT_THANK_YOU_OCCASION_ID]?.[presetLocale] ??
    [];
  const hasRecommended = recommendedMessages.length > 0;

  const handleSelect = (html: string) => {
    onSelect(html);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='border-border sm:max-w-2xl'
        showCloseButton={false}
      >
        <DialogHeader>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex flex-col gap-2'>
              <DialogTitle className='flex items-center gap-2 text-base'>
                <Sparkles size={16} className='text-primary' />
                {t('suggestionsTitle')}
              </DialogTitle>
              <DialogDescription>{t('suggestionsSubtitle')}</DialogDescription>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8 shrink-0'
              onClick={() => onOpenChange(false)}
              aria-label={tActions('close')}
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className='-mr-6 flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-6'>
          {hasRecommended && (
            <section className='flex flex-col gap-2'>
              <span className='text-xs font-semibold tracking-wide text-muted-foreground'>
                {t('suggestionsHeading')}
              </span>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                {recommendedMessages.map(message => (
                  <SuggestionCard
                    key={message.id}
                    message={message}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </section>
          )}

          <section className='flex flex-col gap-2'>
            <span className='text-xs font-semibold tracking-wide text-muted-foreground'>
              {hasRecommended ? t('moreTemplates') : t('allTemplates')}
            </span>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {generalMessages.map(message => (
                <SuggestionCard
                  key={message.id}
                  message={message}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
