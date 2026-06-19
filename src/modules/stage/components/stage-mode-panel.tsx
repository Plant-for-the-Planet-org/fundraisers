'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';
import type { StageModeValues } from './field-paths';
import type { StageSlideTemplate } from './slide-templates';

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
  Eye,
  ImageIcon,
  Info,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { routing } from '@/i18n/routing';
import { STAGE_LIMITS } from '../constants';
import { slideField, stageField } from './field-paths';
import { StagePreviewDialog } from './stage-preview-dialog';
import { StageSlideTemplatesDialog } from './stage-slide-templates-dialog';

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

// The subset of a slide we inspect when deciding whether a row is empty.
// Derived from the schema-backed form type so it tracks any new slide fields.
type SlideValue = Pick<
  StageModeValues['slides'][number],
  'title' | 'description' | 'image'
>;

function CharCount({ current, max }: { current: number; max: number }) {
  const color =
    current > max
      ? 'text-destructive'
      : current > max * 0.92
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

  const { control, register, getValues, setValue } =
    useFormContext<FundraiserFormValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'settings.modules.stage.slides',
  });

  const slideCount = fields.length;
  const atSlideLimit = slideCount >= STAGE_LIMITS.maxSlides;

  // lg breakpoint. Computed once here and passed to every row so each slide
  // renders the same layout without spinning up its own matchMedia listener.
  // Each row renders one of two layouts so each RHF field path registers a
  // single ref — CSS-hidden duplicates would double-register and break
  // validation focus.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Template picker. `templateTarget` is the slide index to fill in place, or
  // `null` when opened from the section button (fill first empty, else append).
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<number | null>(null);
  // Remaining slots when the picker opens in multi-select (section) mode.
  const [sectionCapacity, setSectionCapacity] = useState(0);

  // Slide preview popup. `previewIndex` is the slide to preview, or `null` when closed.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const stageLocaleVal = useWatch({ control, name: stageField('locale') }) as
    | string
    | undefined;
  const templateLocale: 'en' | 'de' = stageLocaleVal === 'de' ? 'de' : 'en';

  const isEmptySlide = (s?: Partial<SlideValue>) =>
    !s?.title && !s?.description && !s?.image;

  const getSlides = (): SlideValue[] =>
    getValues('settings.modules.stage.slides') ?? [];

  // How many templates can still be added: empty rows we can reuse, plus
  // appendable rows up to the slide limit.
  const remainingCapacity = () => {
    const slides = getSlides();
    const emptyCount = slides.filter(isEmptySlide).length;
    return emptyCount + Math.max(0, STAGE_LIMITS.maxSlides - slides.length);
  };

  const openSectionTemplates = () => {
    setSectionCapacity(remainingCapacity());
    setTemplateTarget(null);
    setTemplatesOpen(true);
  };

  const openRowTemplates = (idx: number) => {
    setTemplateTarget(idx);
    setTemplatesOpen(true);
  };

  const fillSlide = (idx: number, template: StageSlideTemplate) => {
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    setValue(slideField(idx, 'title'), template.title, opts);
    setValue(slideField(idx, 'description'), template.description, opts);
    setValue(slideField(idx, 'image'), template.image, opts);
    setValue(slideField(idx, 'duration'), template.duration, opts);
  };

  // Section pick: reuse empty rows first, then append the rest in one batch,
  // stopping at the slide limit.
  const applyTemplates = (selected: StageSlideTemplate[]) => {
    // Copy before mutating: getValues() returns RHF's live internal values by
    // reference, so assigning into it directly would clobber the row objects
    // fillSlide just wrote (wiping position/duration).
    const slides = [...getSlides()];
    const toAppend: Array<{
      position: number;
      title: string;
      description: string;
      image: string;
      duration: number;
    }> = [];
    let projectedLen = slides.length;

    for (const template of selected) {
      const emptyIdx = slides.findIndex(isEmptySlide);
      if (emptyIdx >= 0) {
        fillSlide(emptyIdx, template);
        slides[emptyIdx] = {
          title: template.title,
          description: template.description,
          image: template.image,
        };
        continue;
      }
      if (projectedLen >= STAGE_LIMITS.maxSlides) break;
      toAppend.push({
        position: projectedLen + 1,
        title: template.title,
        description: template.description,
        image: template.image,
        duration: template.duration,
      });
      projectedLen += 1;
    }

    if (toAppend.length) append(toAppend, { shouldFocus: false });
  };

  const handleTemplateConfirm = (selected: StageSlideTemplate[]) => {
    if (templateTarget !== null) {
      if (selected[0]) fillSlide(templateTarget, selected[0]);
      return;
    }
    applyTemplates(selected);
  };

  const stageTitleVal =
    (useWatch({ control, name: stageField('title') }) as string) ?? '';

  const stageDescVal =
    (useWatch({ control, name: stageField('description') }) as string) ?? '';

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
              {...register(stageField('title'))}
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
              {...register(stageField('description'))}
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
              <div className='flex items-center gap-1.5'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-7 gap-1 text-xs'
                  onClick={openSectionTemplates}
                >
                  <Sparkles size={12} />
                  {t('browseTemplates')}
                </Button>
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
            </div>

            {/* Image guidelines — matches the blue hint style in workspace-info.tsx */}
            <div className='flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20'>
              <Info className='mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400' />
              <p className='text-xs text-foreground'>{t('imageGuidelines')}</p>
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
                  onUseTemplate={() => openRowTemplates(idx)}
                  onPreview={() => setPreviewIndex(idx)}
                  isDesktop={isDesktop}
                />
              ))}
            </div>

            <div className='flex justify-end'>
              {/* Bottom add button — saves scrolling back up on long lists. */}
              {fields.length > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-7 gap-1 self-start text-xs border-dashed'
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
              )}
            </div>
          </div>
        </div>
      )}

      <StageSlideTemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        locale={templateLocale}
        multiple={templateTarget === null}
        maxSelectable={sectionCapacity}
        onConfirm={handleTemplateConfirm}
      />

      <StagePreviewDialog
        open={previewIndex !== null}
        onOpenChange={o => !o && setPreviewIndex(null)}
        slideIndex={previewIndex}
      />
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

  const error = errors.settings?.modules?.stage?.partner_logo_url?.message as
    | string
    | undefined;

  return (
    <div className='flex flex-col gap-1'>
      <Input
        {...register(stageField('partner_logo_url'))}
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
  onUseTemplate,
  onPreview,
  isDesktop,
}: {
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUseTemplate: () => void;
  onPreview: () => void;
  isDesktop: boolean;
}) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FundraiserFormValues>();

  const imageUrl =
    (useWatch({ control, name: slideField(idx, 'image') }) as string) ?? '';

  const titleVal =
    (useWatch({ control, name: slideField(idx, 'title') }) as string) ?? '';

  const descVal =
    (useWatch({ control, name: slideField(idx, 'description') }) as string) ??
    '';

  const slideErrors = errors.settings?.modules?.stage?.slides?.[idx];
  const imageError = slideErrors?.image?.message as string | undefined;

  const isEmpty = !titleVal && !descVal && !imageUrl;

  // Shared field fragments — identical registration across both layouts.
  const imageThumb = (
    <div className='h-[60px] w-full rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-muted flex items-center justify-center'>
      {imageUrl ? (
        <img src={imageUrl} alt='' className='w-full h-full object-cover' />
      ) : (
        <ImageIcon size={16} className='text-muted-foreground' />
      )}
    </div>
  );

  const templateButton = isEmpty ? (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      className='h-6 w-full gap-1 px-1 text-[11px] text-primary hover:text-primary'
      onClick={onUseTemplate}
    >
      <Sparkles size={11} />
      {t('useTemplate')}
    </Button>
  ) : null;

  // Preview the slide in the stage layout — only once it has some content.
  const previewButton = !isEmpty ? (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      onClick={onPreview}
      className='h-6 w-full gap-1 px-1 text-[11px] text-muted-foreground hover:text-foreground'
    >
      <Eye size={11} />
      {t('previewSlide')}
    </Button>
  ) : null;

  const titleField = (
    <div className='relative'>
      <Input
        {...register(slideField(idx, 'title'))}
        placeholder={t('slideTitlePlaceholder')}
        maxLength={STAGE_LIMITS.slideTitle}
        className='text-sm font-medium h-8 pr-12'
      />
      <div className='pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'>
        <CharCount current={titleVal.length} max={STAGE_LIMITS.slideTitle} />
      </div>
    </div>
  );

  const descriptionField = (
    <div className='relative'>
      <Textarea
        {...register(slideField(idx, 'description'))}
        placeholder={t('slideDescriptionPlaceholder')}
        maxLength={STAGE_LIMITS.slideDescription}
        rows={1}
        className='text-sm min-h-8 field-sizing-content resize-none py-1.5 pr-12'
      />
      <div className='pointer-events-none absolute right-2.5 bottom-1.5'>
        <CharCount
          current={descVal.length}
          max={STAGE_LIMITS.slideDescription}
        />
      </div>
    </div>
  );

  const urlField = (
    <Input
      {...register(slideField(idx, 'image'))}
      type='url'
      placeholder={t('slideImagePlaceholder')}
      className='text-xs text-muted-foreground h-8'
    />
  );

  const imageErrorMsg = imageError ? (
    <p className='text-xs text-destructive mt-0.5'>{t('imageUrlError')}</p>
  ) : null;

  const durationInput = (
    <Input
      {...register(slideField(idx, 'duration'), { valueAsNumber: true })}
      type='number'
      min={1}
      max={60}
      className='w-14 text-xs h-7 px-2'
    />
  );

  const removeButton = (
    <button
      type='button'
      onClick={onRemove}
      aria-label={t('removeSlide')}
      className='text-muted-foreground hover:text-destructive transition-colors'
    >
      <Trash2 size={13} />
    </button>
  );

  const reorderControls = (
    <>
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
    </>
  );

  // Mobile: stacked. Title + description full width, then image thumbnail on
  // the left with URL and duration stacked beside it. Reorder + position sit
  // in a slim top strip.
  if (!isDesktop) {
    return (
      <div className='flex flex-col gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-background p-2.5'>
        <div className='flex items-center gap-2'>
          {reorderControls}
          <div className='flex-1' />
          {removeButton}
        </div>

        {titleField}
        {descriptionField}

        <div className='flex gap-2'>
          <div className='w-24 shrink-0'>{imageThumb}</div>
          <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
            {urlField}
            {imageErrorMsg}
            <div className='flex items-center gap-2'>
              <Clock size={11} className='text-muted-foreground shrink-0' />
              <span className='text-xs text-muted-foreground'>
                {t('duration')}
              </span>
              {durationInput}
              <span className='text-xs text-muted-foreground'>
                {t('seconds')}
              </span>
            </div>
          </div>
        </div>

        {templateButton}
        {previewButton}
      </div>
    );
  }

  // Desktop: unchanged three-column row.
  return (
    <div className='flex gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-background p-2.5'>
      {/* Reorder + position number */}
      <div className='flex flex-col items-center gap-1 pt-1 shrink-0'>
        {reorderControls}
      </div>

      {/* Image preview + template shortcut + preview-popup trigger */}
      <div className='flex w-24 shrink-0 flex-col gap-1 self-start mt-1'>
        {imageThumb}
        {templateButton}
        {previewButton}
      </div>

      {/* Fields */}
      <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
        {titleField}
        {descriptionField}
        <div>
          {urlField}
          {imageErrorMsg}
        </div>

        <div className='flex items-center gap-2 mt-0.5'>
          <Clock size={11} className='text-muted-foreground shrink-0' />
          <span className='text-xs text-muted-foreground'>{t('duration')}</span>
          {durationInput}
          <span className='text-xs text-muted-foreground'>{t('seconds')}</span>
          <div className='flex-1' />
          {removeButton}
        </div>
      </div>
    </div>
  );
}
