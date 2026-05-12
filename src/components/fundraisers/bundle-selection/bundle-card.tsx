'use client';

import type { Bundle, BundleWorkspace } from '@/lib/types/bundle';
import type { ProjectData } from '@/lib/types/project-selection';

import { useTranslations } from 'next-intl';
import { Check, Eye, Package } from 'lucide-react';
import { getBundleProjectIds } from '@/lib/utils/bundle';
import { cn } from '@/lib/utils/cn';
import { resolveProjectImageSource } from '@/lib/utils/images';

interface BundleCardProps {
  bundle: Bundle;
  workspace: BundleWorkspace;
  isSelected: boolean;
  getProject: (id: string) => ProjectData;
  onSelect: () => void;
  onOpen: () => void;
}

export function BundleCard({
  bundle,
  workspace,
  isSelected,
  getProject,
  onSelect,
  onOpen,
}: BundleCardProps) {
  const t = useTranslations('Fundraisers.form.bundleSelection');
  const projectIds = getBundleProjectIds(bundle, workspace);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={
        isSelected
          ? t('aria.selectedBundle', { name: bundle.label })
          : t('aria.selectBundle', { name: bundle.label })
      }
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex cursor-pointer flex-col gap-3 rounded-xl border bg-background p-4 transition-colors',
        'hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'border-primary ring-1 ring-primary/40' : 'border-border'
      )}
    >
      <div className='flex items-start gap-2'>
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-zinc-400'
          )}
          aria-hidden='true'
        >
          {isSelected && <Check className='h-3.5 w-3.5' />}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1.5'>
            <Package
              className='h-4 w-4 text-muted-foreground'
              aria-hidden='true'
            />
            <p className='font-semibold text-foreground leading-tight'>
              {bundle.label}
            </p>
          </div>
          <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>
            {bundle.tagline}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-5 gap-1.5' aria-hidden='true'>
        {projectIds.map(id => {
          const project = getProject(id);
          const imageSource = resolveProjectImageSource(project.image);
          return (
            <div
              key={id}
              className='h-10 overflow-hidden rounded-md bg-linear-to-br  transition-transform duration-300 hover:scale-110 from-emerald-200 via-purple-300 to-rose-300 dark:from-emerald-900 dark:via-purple-800 dark:to-rose-800'
            >
              {imageSource && (
                <img
                  src={imageSource}
                  alt=''
                  className='h-full w-full object-cover'
                />
              )}
            </div>
          );
        })}
      </div>

      <div className='flex items-center justify-between text-xs'>
        <span className='font-medium tracking-wide text-muted-foreground'>
          {t('card.projectCount', { count: projectIds.length })}
        </span>
        <button
          type='button'
          onClick={event => {
            event.stopPropagation();
            onOpen();
          }}
          aria-haspopup='dialog'
          aria-label={t('aria.openBundle', { name: bundle.label })}
          className='inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <Eye className='h-4 w-4' aria-hidden='true' />
          {t('card.seeInside')}
        </button>
      </div>
    </div>
  );
}
