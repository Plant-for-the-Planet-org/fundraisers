'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  STAGE_SLIDE_TEMPLATES,
  type StageSlideTemplate,
  unsplashThumbnail,
} from './slide-templates';

interface StageSlideTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: 'en' | 'de';
  /** When true, allow picking several templates and confirm with the Add button. */
  multiple?: boolean;
  /** Cap on how many can be selected in multiple mode (remaining slide slots). */
  maxSelectable?: number;
  onConfirm: (templates: StageSlideTemplate[]) => void;
}

function TemplateCard({
  template,
  selected,
  onToggle,
}: {
  template: StageSlideTemplate;
  selected: boolean;
  onToggle: (template: StageSlideTemplate) => void;
}) {
  return (
    <div
      role='button'
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onToggle(template)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(template);
        }
      }}
      className={`group relative flex cursor-pointer items-stretch overflow-hidden rounded-xl border-2 bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? 'border-primary' : 'border-border hover:border-primary'
      }`}
    >
      <div className='h-auto w-24 shrink-0 overflow-hidden bg-muted'>
        {}
        <img
          src={unsplashThumbnail(template.image)}
          alt=''
          className='block h-full w-full object-cover'
          crossOrigin='anonymous'
        />
      </div>
      <div className='flex flex-col justify-center gap-0.5 p-2.5'>
        <span className='text-sm font-semibold text-foreground'>
          {template.title}
        </span>
        <span className='text-xs leading-relaxed text-muted-foreground'>
          {template.description}
        </span>
      </div>
      {selected && (
        <span className='absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground'>
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

export function StageSlideTemplatesDialog({
  open,
  onOpenChange,
  locale,
  multiple = false,
  maxSelectable,
  onConfirm,
}: StageSlideTemplatesDialogProps) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const tActions = useTranslations('Common.actions');
  const templates = STAGE_SLIDE_TEMPLATES[locale] ?? STAGE_SLIDE_TEMPLATES.en;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clear the selection on close so the next open starts fresh.
  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedIds([]);
    onOpenChange(next);
  };

  const atCap =
    typeof maxSelectable === 'number' && selectedIds.length >= maxSelectable;

  const toggle = (template: StageSlideTemplate) => {
    if (!multiple) {
      onConfirm([template]);
      handleOpenChange(false);
      return;
    }
    setSelectedIds(prev => {
      if (prev.includes(template.id)) {
        return prev.filter(id => id !== template.id);
      }
      return atCap ? prev : [...prev, template.id];
    });
  };

  const handleAdd = () => {
    const chosen = templates.filter(tpl => selectedIds.includes(tpl.id));
    if (chosen.length === 0) return;
    onConfirm(chosen);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='border-border sm:max-w-2xl'
        showCloseButton={!multiple}
      >
        <DialogHeader>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex flex-col gap-2'>
              <DialogTitle className='flex items-center gap-2 text-base'>
                <Sparkles size={16} className='text-primary' />
                {t('templatesTitle')}
              </DialogTitle>
              <DialogDescription>
                {multiple
                  ? t('templatesSubtitleMulti')
                  : t('templatesSubtitle')}
              </DialogDescription>
            </div>
            {multiple && (
              <div className='flex shrink-0 items-center gap-2'>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleAdd}
                  disabled={selectedIds.length === 0}
                >
                  {t('addSelected', { count: selectedIds.length })}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8'
                  onClick={() => handleOpenChange(false)}
                  aria-label={tActions('close')}
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogDescription className='-mr-6 max-h-[75vh] overflow-y-auto pr-6'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedIds.includes(template.id)}
                onToggle={toggle}
              />
            ))}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
