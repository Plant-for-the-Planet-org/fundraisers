'use client';

import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState, useSyncExternalStore } from 'react';
import { useFormContext } from 'react-hook-form';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye, Globe, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLUG_MAX_LENGTH } from '@/components/fundraisers/fundraiser-form-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Stable callbacks for useSyncExternalStore. The host never changes within a
// page lifetime, so subscribe is a no-op; the server snapshot stays empty to
// avoid a hydration mismatch.
const subscribeToNothing = () => () => {};
const getHostSnapshot = () => window.location.host;
const getHostServerSnapshot = () => '';

/**
 * Inline link editor shown below the title on the edit page.
 *
 * The slug is locked by default so it cannot be changed by accident, since
 * changing it breaks any link already shared. Unlocking reveals a warning and
 * enables editing. "Preview" always points at the currently saved slug.
 */
export function SlugField({ savedSlug }: { savedSlug: string }) {
  const t = useTranslations('Fundraisers.form.slug');
  const [unlocked, setUnlocked] = useState(false);

  // Display-only live host: empty on the server, filled after hydration.
  const host = useSyncExternalStore(
    subscribeToNothing,
    getHostSnapshot,
    getHostServerSnapshot
  );

  const {
    register,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<FundraiserFormValues>();

  const inputId = 'form-slug';
  const errorId = `${inputId}-error`;

  const hasError = Boolean((touchedFields.slug || isSubmitted) && errors.slug);
  const errorMessage =
    errors.slug?.type === 'too_big'
      ? t('errors.maxLength', { max: SLUG_MAX_LENGTH })
      : errors.slug?.type === 'invalid_format'
        ? t('errors.invalid')
        : t('errors.required');

  // Preview the live page for whatever is saved, not the in-progress edit.
  const livePath = `/raise/${savedSlug}`;

  return (
    <div className='-mt-4 flex flex-col gap-1.5'>
      <div
        className={cn(
          'flex h-9 items-center rounded-md border border-transparent bg-transparent text-sm transition-colors',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
          hasError && 'border-destructive focus-within:border-destructive'
        )}
      >
        <span className='flex shrink-0 select-none items-center text-muted-foreground'>
          <Globe className='mr-1.5 size-3.5 shrink-0' aria-hidden='true' />
          <span className='hidden max-w-[200px] truncate sm:block'>{host}</span>
          <span className='shrink-0 sm:hidden'>…</span>
          <span className='shrink-0'>/raise/</span>
        </span>
        <Input
          id={inputId}
          aria-label={t('label')}
          readOnly={!unlocked}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            'h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0',
            !unlocked && 'cursor-default'
          )}
          {...register('slug')}
        />
        <div className='flex shrink-0 items-center'>
          {!unlocked && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={t('edit')}
              title={t('edit')}
              className='text-muted-foreground/60 hover:text-foreground'
              onClick={() => setUnlocked(true)}
            >
              <Pencil aria-hidden='true' />
            </Button>
          )}
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='text-muted-foreground/60 hover:text-foreground'
          >
            <Link href={livePath} target='_blank' rel='noopener noreferrer'>
              <Eye aria-hidden='true' />
              {t('viewPage')}
            </Link>
          </Button>
        </div>
      </div>

      {hasError ? (
        <p id={errorId} className='text-sm text-destructive'>
          {errorMessage}
        </p>
      ) : unlocked ? (
        <p className='text-sm text-amber-600 dark:text-amber-400'>
          {t('warning')}
        </p>
      ) : null}
    </div>
  );
}
