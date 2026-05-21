'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CopyFieldRowProps {
  label: string;
  value: string;
}

export function CopyFieldRow({ label, value }: CopyFieldRowProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('Donate.thankYou.copy');

  const handleCopy = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('success'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('error'));
    }
  };

  return (
    <div className='flex items-center justify-between border-b border-border py-3.5 last:border-b-0'>
      <div className='min-w-0 flex-1'>
        <p className='text-xs font-medium tracking-wide text-muted-foreground/70'>
          {label}
        </p>
        <p className='mt-0.5 truncate text-sm font-semibold text-foreground'>
          {value}
        </p>
      </div>
      <button
        type='button'
        onClick={handleCopy}
        className='ml-3 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        aria-label={t('label', { field: label })}
      >
        {copied ? (
          <Check className='size-4 text-success' />
        ) : (
          <Copy className='size-4' />
        )}
      </button>
    </div>
  );
}
