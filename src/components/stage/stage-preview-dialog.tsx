'use client';

import type { AccentColor, FontId } from '@/lib/theme/types';
import type { StageSlide } from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { getFontStack } from '@/lib/theme/font-utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { slidePath, stageField } from './field-paths';
import { StagePreview } from './stage-preview';

const DEFAULT_ACCENT = '#16a34a';

interface StagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slideIndex: number | null;
}

export function StagePreviewDialog({
  open,
  onOpenChange,
  slideIndex,
}: StagePreviewDialogProps) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const { control } = useFormContext<FundraiserFormValues>();

  const fundraiserTitle =
    (useWatch({ control, name: 'title' }) as string | undefined) ?? '';
  const accent = useWatch({ control, name: 'settings.theme.accent' }) as
    | string
    | undefined;
  const titleFontId = useWatch({
    control,
    name: 'settings.theme.title_font',
  }) as string | undefined;
  const bodyFontId = useWatch({ control, name: 'settings.theme.body_font' }) as
    | string
    | undefined;
  const stageTitleVal =
    (useWatch({ control, name: stageField('title') }) as string | undefined) ??
    '';
  const stageDescription = useWatch({
    control,
    name: stageField('description'),
  }) as string | undefined;
  const logoUrl = useWatch({
    control,
    name: stageField('partner_logo_url'),
  }) as string | undefined;
  const slide = useWatch({
    control,
    name: slidePath(slideIndex ?? 0),
  }) as StageSlide | undefined;

  if (slideIndex === null || !slide) return null;

  const accentColor = accent
    ? getAccentColor(accent as AccentColor)
    : undefined;
  const titleFont = titleFontId
    ? getFontStack(titleFontId as FontId)
    : undefined;
  const bodyFont = bodyFontId ? getFontStack(bodyFontId as FontId) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='w-[calc(100%-2rem)] max-w-[1100px] border-0 bg-transparent p-0 shadow-none sm:max-w-[1100px]'
      >
        <DialogTitle className='sr-only'>{t('previewSlide')}</DialogTitle>
        <div className='relative'>
          <StagePreview
            slide={slide}
            stageTitle={stageTitleVal || fundraiserTitle}
            stageDescription={stageDescription}
            logoUrl={logoUrl || undefined}
            accentColor={accentColor ?? DEFAULT_ACCENT}
            titleFont={titleFont ?? 'var(--theme-title-font)'}
            bodyFont={bodyFont ?? 'var(--theme-body-font)'}
          />
          <DialogClose
            aria-label={t('previewClose')}
            className='absolute -top-3 -right-3 z-10 grid size-8 place-items-center rounded-full bg-background text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-muted'
          >
            <X size={16} />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
