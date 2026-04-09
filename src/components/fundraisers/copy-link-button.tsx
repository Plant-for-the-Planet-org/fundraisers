'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type CopyLinkButtonProps = {
  url?: string;
};

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('Fundraisers.copyLinkButton');

  const handleCopy = async () => {
    if (copied) return;

    try {
      await navigator.clipboard.writeText(url ?? window.location.href);
      toast.success(t('successToast'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('errorToast'));
    }
  };

  return (
    <Button
      variant='outline'
      onClick={handleCopy}
      className='mt-3 w-max border-border bg-white hover:bg-gray-50'
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
