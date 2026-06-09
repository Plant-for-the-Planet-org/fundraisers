'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
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
  onSelect: (template: StageSlideTemplate) => void;
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: StageSlideTemplate;
  onSelect: (template: StageSlideTemplate) => void;
}) {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect(template)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(template);
        }
      }}
      className='group flex cursor-pointer items-stretch overflow-hidden rounded-xl border-2 border-border bg-background transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
    </div>
  );
}

export function StageSlideTemplatesDialog({
  open,
  onOpenChange,
  locale,
  onSelect,
}: StageSlideTemplatesDialogProps) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const templates = STAGE_SLIDE_TEMPLATES[locale] ?? STAGE_SLIDE_TEMPLATES.en;

  const handleSelect = (template: StageSlideTemplate) => {
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='border-border sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <Sparkles size={16} className='text-primary' />
            {t('templatesTitle')}
          </DialogTitle>
          <DialogDescription>{t('templatesSubtitle')}</DialogDescription>
        </DialogHeader>

        <DialogDescription className='-mr-6 max-h-[75vh] overflow-y-auto pr-6'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
