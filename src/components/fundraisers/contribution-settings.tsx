'use client';

import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useMemo, useState } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  MAX_AMOUNT_UNITS,
  readContributionEditor,
  storedToDonationSettings,
  writeContributionEditor,
} from '@/lib/utils/contribution-editor';
import { ContributionSettingsPopover } from './contribution-settings-popover';
import { DonationForm } from './donation-form';
import { SectionHeader } from './typography';

export function ContributionSettings() {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const currency = useWatch({ name: 'currency' }) as string;
  const { field } = useController<
    FundraiserFormValues,
    'settings.modules.contribution'
  >({ name: 'settings.modules.contribution' });

  const previewSettings = useMemo(
    () => storedToDonationSettings(field.value),
    [field.value]
  );

  const editor = readContributionEditor(field.value);
  // What a host is typing in a tile, until the tile loses focus.
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const commit = (changes: Partial<typeof editor>) =>
    field.onChange(writeContributionEditor({ ...editor, ...changes }));

  const amountEditor = {
    values: editor.presets.map(
      (amount, index) => drafts[index] ?? String(amount)
    ),
    selectedIndex: editor.presets.indexOf(editor.defaultAmount),
    onSelect: (index: number) =>
      commit({ defaultAmount: editor.presets[index] }),
    onChange: (index: number, raw: string) =>
      setDrafts(prev => ({
        ...prev,
        [index]: raw.replace(/\D/g, '').slice(0, 6),
      })),
    // Kept only when it is a real amount that no other tile has; the first tile to change keeps the order simple, as the amounts are shown smallest first.
    onCommit: (index: number) => {
      const draft = drafts[index];
      setDrafts(({ [index]: _dropped, ...rest }) => rest);
      if (draft === undefined) return;
      const next = Number(draft);
      const old = editor.presets[index];
      const taken = editor.presets.some(
        (amount, i) => i !== index && amount === next
      );
      if (!(next >= 1 && next <= MAX_AMOUNT_UNITS) || taken || next === old)
        return;
      commit({
        presets: editor.presets.map((amount, i) =>
          i === index ? next : amount
        ),
        // The tile shown first keeps that role when its amount changes.
        defaultAmount:
          old === editor.defaultAmount ? next : editor.defaultAmount,
      });
    },
  };

  // Changing an amount must not restart the preview, or the tile would lose focus while typing.
  const previewKey = JSON.stringify({
    ...field.value,
    options: field.value?.options?.filter(option => option.unit === undefined),
  });

  return (
    <div className='contribution-settings flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={
          <ContributionSettingsPopover
            value={field.value}
            currency={currency}
            onChange={field.onChange}
          />
        }
      >
        {t('sectionHeading')}
      </SectionHeader>
      <p className='-mt-1 text-xs text-muted-foreground'>{t('previewHint')}</p>
      {/* A preview of what donors see; it starts again whenever a setting changes, so the preselected amount and frequency show. */}
      <DonationForm
        key={previewKey}
        amountEditor={amountEditor}
        preview
        currency={currency}
        contributionSettings={previewSettings}
      />
    </div>
  );
}
