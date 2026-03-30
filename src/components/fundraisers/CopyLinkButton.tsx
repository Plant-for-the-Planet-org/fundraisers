'use client';

import { useState } from 'react';
import { Check, Link } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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
    <button
      type='button'
      onClick={handleCopy}
      className='mt-3 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all w-max'
    >
      {copied ? (
        <Check className='h-4 w-4 text-green-600' aria-hidden='true' />
      ) : (
        <Link className='h-4 w-4' aria-hidden='true' />
      )}
      {copied ? t('copiedLabel') : t('label')}
    </button>
  );
}
