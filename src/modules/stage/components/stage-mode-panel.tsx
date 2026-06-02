'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ImageIcon,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { routing } from '@/i18n/routing';
import { STAGE_LIMITS } from '../constants';

const LOCALE_OPTIONS: Record<string, string> = {
  en: '🇬🇧 English',
  de: '🇩🇪 Deutsch',
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_SLIDE = {
  position: 1,
  title: '',
  description: '',
  image: '',
  duration: 8,
};

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

export function StageModePanel({ onRemove }: { onRemove: () => void }) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const [expanded, setExpanded] = useState(true);

  const { control, register } = useFormContext<FundraiserFormValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'settings.modules.stage.slides',
  });

  const slideCount = fields.length;
  const atSlideLimit = slideCount >= STAGE_LIMITS.maxSlides;

  const stageTitleVal =
    (useWatch({
      control,
      name: 'settings.modules.stage.title' as any,
    }) as string) ?? '';

  const stageDescVal =
    (useWatch({
      control,
      name: 'settings.modules.stage.description' as any,
    }) as string) ?? '';

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
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold'>{t('title')}</span>
            <span className='text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded'>
              {slideCount === 1
                ? t('slideCountOne')
                : t('slideCountMany', { count: String(slideCount) })}
            </span>
          </div>
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
          name='settings.modules.stage.enabled'
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
          {/* Stage title */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold'>{t('stageTitle')}</Label>
              <CharCount
                current={stageTitleVal.length}
                max={STAGE_LIMITS.stageTitle}
              />
            </div>
            <Input
              {...register('settings.modules.stage.title')}
              placeholder={t('stageTitlePlaceholder')}
              maxLength={STAGE_LIMITS.stageTitle}
              className='text-sm'
            />
          </div>

          {/* Stage description */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold'>
                {t('stageDescription')}
              </Label>
              <CharCount
                current={stageDescVal.length}
                max={STAGE_LIMITS.stageDescription}
              />
            </div>
            <Textarea
              {...register('settings.modules.stage.description')}
              placeholder={t('stageDescriptionPlaceholder')}
              rows={2}
              maxLength={STAGE_LIMITS.stageDescription}
              className='text-sm resize-none'
            />
          </div>

          {/* Language + Partner logo */}
          <div className='grid grid-cols-3 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs font-semibold'>{t('locale')}</Label>
              <Controller
                control={control}
                name='settings.modules.stage.locale'
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className='w-full text-sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {routing.locales.map(locale => (
                        <SelectItem key={locale} value={locale}>
                          {LOCALE_OPTIONS[locale] ?? locale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className='flex flex-col gap-1.5 col-span-2'>
              <Label className='text-xs font-semibold'>
                {t('partnerLogo')}{' '}
                <span className='font-normal text-muted-foreground'>
                  ({t('optional')})
                </span>
              </Label>
              <PartnerLogoField register={register} t={t} />
            </div>
          </div>

          {/* Slides */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold'>{t('slides')}</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 gap-1 text-xs border-dashed'
                disabled={atSlideLimit}
                title={
                  atSlideLimit
                    ? t('maxSlidesReached', {
                        max: String(STAGE_LIMITS.maxSlides),
                      })
                    : undefined
                }
                onClick={() =>
                  append({ ...DEFAULT_SLIDE, position: fields.length + 1 })
                }
              >
                <Plus size={12} />
                {t('addSlide')}
              </Button>
            </div>

            {atSlideLimit && (
              <p className='text-xs text-muted-foreground'>
                {t('maxSlidesReached', { max: String(STAGE_LIMITS.maxSlides) })}
              </p>
            )}

            {fields.length === 0 && (
              <div className='rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-5 text-center text-xs text-muted-foreground'>
                {t('noSlides')}
              </div>
            )}

            <div className='flex flex-col gap-2'>
              {fields.map((field, idx) => (
                <SlideRow
                  key={field.id}
                  idx={idx}
                  total={fields.length}
                  onMoveUp={() => move(idx, idx - 1)}
                  onMoveDown={() => move(idx, idx + 1)}
                  onRemove={() => remove(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PartnerLogoField({
  register,
  t,
}: {
  register: ReturnType<typeof useFormContext<FundraiserFormValues>>['register'];
  t: ReturnType<typeof useTranslations>;
}) {
  const {
    formState: { errors },
  } = useFormContext<FundraiserFormValues>();

  const error = (errors.settings?.modules?.stage as any)?.partner_logo_url
    ?.message as string | undefined;

  return (
    <div className='flex flex-col gap-1'>
      <Input
        {...register('settings.modules.stage.partner_logo_url')}
        type='url'
        placeholder='https://…'
        className='text-sm'
      />
      {error && (
        <p className='text-xs text-destructive'>{t('imageUrlError')}</p>
      )}
    </div>
  );
}

function SlideRow({
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FundraiserFormValues>();
  const base = `settings.modules.stage.slides.${idx}` as const;

  const imageUrl =
    (useWatch({ control, name: `${base}.image` as any }) as string) ?? '';

  const titleVal =
    (useWatch({ control, name: `${base}.title` as any }) as string) ?? '';

  const descVal =
    (useWatch({ control, name: `${base}.description` as any }) as string) ?? '';

  const slideErrors = (errors.settings?.modules?.stage as any)?.slides?.[idx];
  const imageError = slideErrors?.image?.message as string | undefined;

  return (
    <div className='flex gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-background p-2.5'>
      {/* Reorder + position number */}
      <div className='flex flex-col items-center gap-1 pt-1 shrink-0'>
        <button
          type='button'
          onClick={onMoveUp}
          disabled={idx === 0}
          aria-label={t('moveUp')}
          className='text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed'
        >
          <ChevronUp size={14} />
        </button>
        <div className='size-5 rounded bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center'>
          {idx + 1}
        </div>
        <button
          type='button'
          onClick={onMoveDown}
          disabled={idx === total - 1}
          aria-label={t('moveDown')}
          className='text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed'
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Image preview */}
      <div className='w-24 h-[60px] shrink-0 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-muted flex items-center justify-center self-start mt-1'>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=''
            className='w-full h-full object-cover'
            crossOrigin='anonymous'
          />
        ) : (
          <ImageIcon size={16} className='text-muted-foreground' />
        )}
      </div>

      {/* Fields */}
      <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
        <div>
          {}
          <Input
            {...register(`${base}.title` as any)}
            placeholder={t('slideTitlePlaceholder')}
            maxLength={STAGE_LIMITS.slideTitle}
            className='text-sm font-medium h-8'
          />
          <div className='flex justify-end mt-0.5'>
            <CharCount
              current={titleVal.length}
              max={STAGE_LIMITS.slideTitle}
            />
          </div>
        </div>

        <div>
          {}
          <Textarea
            {...register(`${base}.description` as any)}
            placeholder={t('slideDescriptionPlaceholder')}
            maxLength={STAGE_LIMITS.slideDescription}
            rows={1}
            className='text-sm min-h-8 field-sizing-content resize-none py-1.5'
          />
          <div className='flex justify-end mt-0.5'>
            <CharCount
              current={descVal.length}
              max={STAGE_LIMITS.slideDescription}
            />
          </div>
        </div>

        <div>
          {}
          <Input
            {...register(`${base}.image` as any)}
            type='url'
            placeholder={t('slideImagePlaceholder')}
            className='text-xs text-muted-foreground h-8'
          />
          {imageError && (
            <p className='text-xs text-destructive mt-0.5'>
              {t('imageUrlError')}
            </p>
          )}
        </div>

        <div className='flex items-center gap-2 mt-0.5'>
          <Clock size={11} className='text-muted-foreground shrink-0' />
          <span className='text-xs text-muted-foreground'>{t('duration')}</span>
          {}
          <Input
            {...register(`${base}.duration` as any, { valueAsNumber: true })}
            type='number'
            min={1}
            max={60}
            className='w-14 text-xs h-7 px-2'
          />
          <span className='text-xs text-muted-foreground'>{t('seconds')}</span>
          <div className='flex-1' />
          <button
            type='button'
            onClick={onRemove}
            aria-label={t('removeSlide')}
            className='text-muted-foreground hover:text-destructive transition-colors'
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
