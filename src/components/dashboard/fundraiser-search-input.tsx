'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { Input } from '@/components/ui/input';

interface FundraiserSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

const DEBOUNCE_MS = 250;

export function FundraiserSearchInput({
  value,
  onChange,
  className,
}: FundraiserSearchInputProps) {
  const t = useTranslations('Dashboard.toolbar');
  const [internalValue, setInternalValue] = useState(value);
  const [prevExternalValue, setPrevExternalValue] = useState(value);

  // Sync from parent when it forces a value change (e.g. "Clear filters").
  if (value !== prevExternalValue) {
    setPrevExternalValue(value);
    setInternalValue(value);
  }

  useEffect(() => {
    if (internalValue === value) return;

    const handle = setTimeout(() => {
      onChange(internalValue);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [internalValue, value, onChange]);

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
        aria-hidden='true'
      />
      <Input
        type='search'
        value={internalValue}
        onChange={event => setInternalValue(event.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        className='h-11 rounded-xl bg-background pl-9 pr-4 [&::-webkit-search-cancel-button]:cursor-pointer'
      />
    </div>
  );
}
