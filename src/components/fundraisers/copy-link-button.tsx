'use client';

import type { ComponentProps } from 'react';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type CopyLinkButtonProps = {
  url?: string;
  size?: ComponentProps<typeof Button>['size'];
};

export function CopyLinkButton({ url, size }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('Fundraisers.copyLinkButton');

  const handleCopy = async () => {
    if (copied) return;

    // Without a url, the page's own path, never the query it was opened with: that may carry someone else's `ref` code.
    const link = url ?? window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('successToast'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Shows the link itself, so nobody falls back to the address bar and its landing query.
      toast.error(t('errorToast'), { description: link, duration: 10_000 });
    }
  };

  return (
    <Button
      variant='outline'
      size={size}
      onClick={handleCopy}
      className='w-max border-border bg-white hover:bg-gray-50'
    >
      {copied ? (
        <Check className='text-green-600' aria-hidden='true' />
      ) : (
        <Link aria-hidden='true' />
      )}
      {copied ? t('copiedLabel') : t('label')}
    </Button>
  );
}
