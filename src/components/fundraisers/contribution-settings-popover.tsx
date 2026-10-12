'use client';

import type {
  EditableFrequency,
  StoredContribution,
} from '@/lib/utils/contribution-editor';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import {
  DEFAULT_CONTRIBUTION,
  EDITABLE_FREQUENCIES,
  PLATFORM_MIN_UNITS,
  readContributionEditor,
  writeContributionEditor,
} from '@/lib/utils/contribution-editor';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SectionSettingsButton } from './section-settings-button';

const digits = (value: string) => value.replace(/\D/g, '').slice(0, 6);

function SettingsGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='space-y-2'>
      <div>
        <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          {title}
        </h3>
        {hint && <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * The contribution box's settings, in the same corner as the leaderboard's: whether donors may enter their own amount and the smallest they may enter, and which frequencies are on offer and which is selected first.
 * The preset amounts themselves are edited in the preview tiles, not here.
 * Whatever the host leaves at the platform's own is stored as nothing, so only real choices change what donors see.
 */
export function ContributionSettingsPopover({
  value,
  currency,
  onChange,
}: {
  value: StoredContribution | undefined;
  currency: string;
  onChange: (next: StoredContribution) => void;
}) {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const [open, setOpen] = useState(false);
  const editor = readContributionEditor(value);
  const symbol = getCurrencySymbol(currency);

  const [min, setMin] = useState(() => String(editor.customMin));
  // Each opening starts from what is stored; typing inside must not reset what is being typed, so it is not an effect.
  const handleOpenChange = (next: boolean) => {
    if (next) setMin(String(readContributionEditor(value).customMin));
    setOpen(next);
  };

  const commit = (changes: Partial<typeof editor>) =>
    onChange(writeContributionEditor({ ...editor, ...changes }));

  const minNumber = Number(min);
  const minTooLow = min !== '' && minNumber < PLATFORM_MIN_UNITS;
  const onlyFrequency = editor.frequencies.length === 1;

  const frequencyLabel = (frequency: EditableFrequency) =>
    t(
      `frequency.${frequency === 'once' ? 'oneTime' : frequency}` as
        | 'frequency.oneTime'
        | 'frequency.monthly'
        | 'frequency.yearly'
    );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <SectionSettingsButton isOpen={open} aria-label={t('settings.open')} />
      </PopoverTrigger>
      <PopoverContent
        align='end'
        // Stays inside the screen, clear of the sticky save bar, and scrolls inside itself instead of running off the page.
        collisionPadding={{ top: 16, right: 16, bottom: 84, left: 16 }}
        className='max-h-[min(var(--radix-popover-content-available-height),36rem)] w-[min(20rem,calc(100vw-2rem))] space-y-4 overflow-y-auto overscroll-contain border-border p-4'
      >
        <SettingsGroup title={t('settings.customTitle')}>
          <div className='flex items-start justify-between gap-4'>
            <div className='grid gap-0.5'>
              <Label
                htmlFor='contribution-custom'
                className='text-sm font-normal'
              >
                {t('settings.customSwitch')}
              </Label>
              <p className='text-xs text-muted-foreground'>
                {t('settings.customHint')}
              </p>
            </div>
            <Switch
              size='compact'
              id='contribution-custom'
              className='mt-0.5 shrink-0'
              checked={editor.allowCustom}
              onCheckedChange={allowCustom => commit({ allowCustom })}
            />
          </div>
          {editor.allowCustom && (
            <div className='space-y-1'>
              <Label htmlFor='contribution-min' className='text-sm font-normal'>
                {t('settings.minimum')}
              </Label>
              <div className='relative'>
                <span
                  aria-hidden='true'
                  className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
                >
                  {symbol}
                </span>
                <Input
                  id='contribution-min'
                  inputMode='numeric'
                  value={min}
                  aria-invalid={minTooLow}
                  aria-describedby='contribution-min-hint'
                  onChange={event => {
                    const next = digits(event.target.value);
                    setMin(next);
                    if (Number(next) >= PLATFORM_MIN_UNITS)
                      commit({ customMin: Number(next) });
                  }}
                  onBlur={() => {
                    // Never below the platform's own smallest amount.
                    if (min === '' || Number(min) < PLATFORM_MIN_UNITS) {
                      setMin(String(PLATFORM_MIN_UNITS));
                      commit({ customMin: PLATFORM_MIN_UNITS });
                    }
                  }}
                  className='h-9 pl-8'
                />
              </div>
              <p
                id='contribution-min-hint'
                className={cn(
                  'text-xs',
                  minTooLow ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {t('settings.minimumHint', {
                  min: `${symbol}${PLATFORM_MIN_UNITS}`,
                })}
              </p>
            </div>
          )}
        </SettingsGroup>

        <SettingsGroup
          title={t('settings.frequencyTitle')}
          hint={t('settings.frequencyHint')}
        >
          <div className='space-y-2'>
            {EDITABLE_FREQUENCIES.map(frequency => {
              const on = editor.frequencies.includes(frequency);
              return (
                <div
                  key={frequency}
                  className='flex items-center justify-between gap-4'
                >
                  <Label
                    htmlFor={`contribution-frequency-${frequency}`}
                    className='text-sm font-normal'
                  >
                    {frequencyLabel(frequency)}
                  </Label>
                  <Switch
                    size='compact'
                    id={`contribution-frequency-${frequency}`}
                    checked={on}
                    // One frequency always stays on, so donors can always give.
                    disabled={on && onlyFrequency}
                    onCheckedChange={checked =>
                      commit({
                        frequencies: checked
                          ? [...editor.frequencies, frequency]
                          : editor.frequencies.filter(f => f !== frequency),
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
          {!onlyFrequency && (
            <div className='space-y-1'>
              <Label
                htmlFor='contribution-default-frequency'
                className='text-sm font-normal'
              >
                {t('settings.selectedFirst')}
              </Label>
              <Select
                value={editor.defaultFrequency}
                onValueChange={defaultFrequency =>
                  commit({
                    defaultFrequency: defaultFrequency as EditableFrequency,
                  })
                }
              >
                <SelectTrigger
                  id='contribution-default-frequency'
                  className='h-9 w-full'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editor.frequencies.map(frequency => (
                    <SelectItem key={frequency} value={frequency}>
                      {frequencyLabel(frequency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </SettingsGroup>

        <SettingsGroup title={t('settings.moreTitle')}>
          <div className='flex items-start justify-between gap-4'>
            <div className='grid gap-0.5'>
              <Label
                htmlFor='contribution-dedication'
                className='text-sm font-normal'
              >
                {t('settings.dedication')}
              </Label>
              <p className='text-xs text-muted-foreground'>
                {t('settings.dedicationHint')}
              </p>
            </div>
            <Switch
              size='compact'
              id='contribution-dedication'
              className='mt-0.5 shrink-0'
              checked={editor.allowDedication}
              onCheckedChange={allowDedication => commit({ allowDedication })}
            />
          </div>
        </SettingsGroup>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='-ml-2 text-muted-foreground'
          onClick={() => {
            onChange({
              ...DEFAULT_CONTRIBUTION,
              allow_dedication: editor.allowDedication,
            });
            setMin(String(readContributionEditor(undefined).customMin));
          }}
        >
          {t('settings.reset')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
