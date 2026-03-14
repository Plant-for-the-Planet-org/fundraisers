'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';

import type { CreateFundraiserFormValues } from '@/components/fundraisers/create-fundraiser-form-context';
import { SectionHeader } from '@/components/fundraisers/typography';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';
import type { SafeHtml } from '@/lib/types/safe-html';
import { sanitizeDescriptionHtml } from '@/lib/utils/sanitize-html';

interface DescriptionProps {
  mode?: 'read' | 'write';
  value?: string | null;
  className?: string;
}

export function Description({
  mode = 'read',
  value,
  className,
}: DescriptionProps) {
  if (mode === 'read') {
    const safeValue =
      typeof value === 'string' ? sanitizeDescriptionHtml(value) : null;

    return <DescriptionDisplay value={safeValue} className={className} />;
  }

  return <DescriptionInput />;
}

interface DescriptionDisplayProps {
  value: SafeHtml | null;
  className?: string;
}

function DescriptionDisplay({ value, className }: DescriptionDisplayProps) {
  const t = useTranslations('Fundraisers.create.description');

  if (!value) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>
      <div
        className={cn(
          'text-sm text-foreground leading-relaxed [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-6 [&_ol]:list-decimal [&_li]:my-1 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through',
          className
        )}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

function DescriptionInput() {
  const t = useTranslations('Fundraisers.create.description');
  const descriptionId = 'form-description';
  const errorId = `${descriptionId}-error`;

  const {
    control,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<CreateFundraiserFormValues>();

  const hasDescriptionError = Boolean(
    (touchedFields.description || isSubmitted) && errors.description
  );

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>

      <Controller
        name='description'
        control={control}
        render={({ field }) => (
          <RichTextEditor
            className={cn(hasDescriptionError && 'border-b border-destructive')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('placeholder')}
            aria-label={t('label')}
            ariaInvalid={hasDescriptionError}
            ariaDescribedBy={hasDescriptionError ? errorId : undefined}
          />
        )}
      />

      <p id={errorId} className='text-sm h-5 text-destructive'>
        {hasDescriptionError ? t('errors.required') : ''}
      </p>
    </div>
  );
}
